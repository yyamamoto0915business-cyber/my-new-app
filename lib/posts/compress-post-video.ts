import {
  POST_VIDEO_UPLOAD_MAX_BYTES,
  pickMediaRecorderMimeType,
} from "@/lib/posts/post-video";

const AUDIO_BITRATE = 64_000;
const MIN_VIDEO_BITRATE = 180_000;

type CaptureCanvas = HTMLCanvasElement & {
  captureStream: (frameRate?: number) => MediaStream;
};

function extFromMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

function cleanMime(mime: string): string {
  return mime.split(";")[0]?.trim() || "video/webm";
}

function targetBitrate(durationSec: number, maxBytes: number): number {
  const safeDuration = Math.max(1, durationSec);
  const bits = maxBytes * 8 * 0.88;
  const total = Math.floor(bits / safeDuration);
  return Math.max(MIN_VIDEO_BITRATE, total - AUDIO_BITRATE);
}

function targetSize(maxEdge: number, width: number, height: number): {
  width: number;
  height: number;
} {
  const long = Math.max(width, height);
  if (long <= maxEdge) {
    return {
      width: Math.max(2, Math.round(width / 2) * 2),
      height: Math.max(2, Math.round(height / 2) * 2),
    };
  }
  const scale = maxEdge / long;
  return {
    width: Math.max(2, Math.round((width * scale) / 2) * 2),
    height: Math.max(2, Math.round((height * scale) / 2) * 2),
  };
}

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    const url = URL.createObjectURL(file);
    video.onloadeddata = () => resolve(video);
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("動画を読み込めませんでした"));
    };
    video.src = url;
  });
}

async function recordPass(
  file: File,
  maxEdge: number,
  videoBitrate: number,
  maxBytes: number,
): Promise<File | null> {
  const mime = pickMediaRecorderMimeType();
  if (!mime || typeof MediaRecorder === "undefined") return null;

  const video = await loadVideo(file);
  const srcUrl = video.src;
  const size = targetSize(
    maxEdge,
    video.videoWidth || 1280,
    video.videoHeight || 720,
  );
  const canvas = document.createElement("canvas") as CaptureCanvas;
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof canvas.captureStream !== "function") {
    URL.revokeObjectURL(srcUrl);
    return null;
  }

  const fps = videoBitrate < 400_000 ? 20 : 24;
  const canvasStream = canvas.captureStream(fps);
  const mixed = new MediaStream(canvasStream.getVideoTracks());

  let audioCtx: AudioContext | null = null;
  try {
    audioCtx = new AudioContext();
    await audioCtx.resume();
    const source = audioCtx.createMediaElementSource(video);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    for (const track of dest.stream.getAudioTracks()) {
      mixed.addTrack(track);
    }
  } catch {
    audioCtx = null;
  }

  let stopped = false;
  const draw = () => {
    if (stopped) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(draw);
    } else {
      requestAnimationFrame(draw);
    }
  };

  const chunks: Blob[] = [];
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(mixed, {
      mimeType: mime,
      videoBitsPerSecond: videoBitrate,
      audioBitsPerSecond: AUDIO_BITRATE,
    });
  } catch {
    URL.revokeObjectURL(srcUrl);
    await audioCtx?.close().catch(() => undefined);
    return null;
  }

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("動画の圧縮に失敗しました"));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: cleanMime(mime) }));
    };
  });

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  draw();
  video.currentTime = 0;
  try {
    await video.play();
  } catch {
    stopped = true;
    URL.revokeObjectURL(srcUrl);
    await audioCtx?.close().catch(() => undefined);
    return null;
  }

  recorder.start(200);
  await new Promise<void>((resolve) => {
    video.onended = () => resolve();
  });
  if (recorder.state !== "inactive") recorder.stop();
  stopped = true;
  video.pause();

  const blob = await recorded;
  for (const track of mixed.getTracks()) track.stop();
  URL.revokeObjectURL(srcUrl);
  await audioCtx?.close().catch(() => undefined);

  if (!blob.size || blob.size > maxBytes) return null;
  const base = file.name.replace(/\.[^.]+$/, "") || "video";
  return new File([blob], `${base}.${extFromMime(mime)}`, {
    type: cleanMime(mime),
  });
}

/**
 * Vercel のリクエスト上限（約4.5MB）に収まるよう、必要なら再エンコードする。
 * すでに小さいファイルはそのまま返す。
 */
export async function compressPostVideo(file: File): Promise<File> {
  if (file.size <= POST_VIDEO_UPLOAD_MAX_BYTES) return file;

  const video = await loadVideo(file);
  const duration = Number.isFinite(video.duration) ? video.duration : 60;
  URL.revokeObjectURL(video.src);

  const passes: Array<{ edge: number; bitrateScale: number }> = [
    { edge: 854, bitrateScale: 1 },
    { edge: 640, bitrateScale: 0.72 },
    { edge: 480, bitrateScale: 0.5 },
  ];

  for (const pass of passes) {
    const bitrate = Math.floor(
      targetBitrate(duration, POST_VIDEO_UPLOAD_MAX_BYTES) * pass.bitrateScale,
    );
    const out = await recordPass(
      file,
      pass.edge,
      Math.max(MIN_VIDEO_BITRATE, bitrate),
      POST_VIDEO_UPLOAD_MAX_BYTES,
    );
    if (out) return out;
  }

  throw new Error(
    "動画が大きすぎて送れません。短い動画にするか、画質を下げて選び直してください",
  );
}
