"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Images, Leaf, Loader2 } from "lucide-react";
import { PostCreateForm } from "@/components/posts/PostCreateForm";
import { PostCreateSidebar } from "@/components/posts/PostCreateSidebar";
import { PostCreatePreviewSheet } from "@/components/posts/PostCreatePreviewSheet";
import { PostCreateDraftControl } from "@/components/posts/PostCreateDraftControl";
import { useMyDrafts } from "@/hooks/use-my-drafts";
import {
  DEFAULT_POST_CREATE_DRAFT,
  buildPostCreateDraftFromSource,
  canSubmitPostCreateDraft,
  getPostCreateAreaLabel,
  getPostCreateMediaKind,
  type PostCreateDraft,
  type PostCreateResumeSource,
} from "@/lib/posts/post-create-draft";

async function uploadPostFile(
  file: File,
  kind: "image" | "video",
  durationSec?: number,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  if (kind === "video" && durationSec != null) {
    form.append("durationSec", String(durationSec));
  }
  const res = await fetch("/api/posts/upload", { method: "POST", body: form });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? "アップロードに失敗しました");
  }
  return json.url;
}

type PostStatus = "draft" | "public" | "hidden";

export function PostCreatePageClient({ postId }: { postId?: string } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draft");
  // 読み込み対象: 公開/非公開の編集は postId、下書き再開は ?draft=
  const loadId = postId ?? draftIdParam;

  const [draft, setDraft] = useState<PostCreateDraft>(DEFAULT_POST_CREATE_DRAFT);
  const [draftId, setDraftId] = useState<string | null>(null);
  // 読み込んだ投稿の元ステータス（編集時に維持する）
  const [sourceStatus, setSourceStatus] = useState<PostStatus | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // 下書き一覧の再取得トリガー
  const [draftsReloadToken, setDraftsReloadToken] = useState(0);
  const { drafts } = useMyDrafts(draftsReloadToken);

  const videoUrlRef = useRef<string | null>(null);
  const videoFileRef = useRef<File | null>(null);
  // 既存の下書きから復元した写真は File を持たない（null = サーバ既存URL）
  const photoFilesRef = useRef<(File | null)[]>([]);
  const photoUrlRefs = useRef<string[]>([]);
  // すでにこのクライアントで読み込み済みの下書きID（自分の保存で再取得しないため）
  const loadedDraftIdRef = useRef<string | null>(null);

  const canSubmit = canSubmitPostCreateDraft(draft) && !submitting;

  // postId で開かれた＝公開/非公開の投稿を編集するモード
  const isEditMode = postId != null;
  // 公開中・非公開の投稿を編集中は元のステータスを維持する（下書きに戻さない）
  const keepStatusOnSave =
    isEditMode && sourceStatus != null && sourceStatus !== "draft";

  // 既存の投稿・下書きを読み込んで、続きから編集できるようにする
  useEffect(() => {
    if (!loadId) {
      setDraftId(null);
      setSourceStatus(null);
      return;
    }
    // 自分の保存で URL に付いた ID は再取得しない（入力中の内容を保持）
    if (loadId === loadedDraftIdRef.current) return;
    let cancelled = false;
    setResumeLoading(true);
    setSubmitError(null);
    fetch(`/api/me/posts/${loadId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as PostCreateResumeSource & {
          id: string;
          status: PostStatus;
        };
      })
      .then((data) => {
        if (cancelled) return;
        const restored = buildPostCreateDraftFromSource(data);
        // 復元した写真はサーバURLのまま（File なし）
        photoFilesRef.current = restored.imagePreviewUrls.map(() => null);
        photoUrlRefs.current = [...restored.imagePreviewUrls];
        videoFileRef.current = null;
        videoUrlRef.current = null;
        setDraft(restored);
        setDraftId(data.id);
        setSourceStatus(data.status);
        loadedDraftIdRef.current = data.id;
      })
      .catch(() => {
        if (!cancelled) {
          setSubmitError(
            isEditMode
              ? "投稿の読み込みに失敗しました"
              : "下書きの読み込みに失敗しました",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setResumeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadId, isEditMode]);

  useEffect(() => {
    return () => {
      if (videoUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      photoUrlRefs.current.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  function updateDraft(patch: Partial<PostCreateDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function clearVideoMedia() {
    if (videoUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrlRef.current);
    }
    videoUrlRef.current = null;
    videoFileRef.current = null;
    updateDraft({ videoPreviewUrl: null, videoDurationSec: null });
  }

  function clearPhotoMedia() {
    photoUrlRefs.current.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    photoUrlRefs.current = [];
    photoFilesRef.current = [];
    updateDraft({ imagePreviewUrls: [] });
  }

  function handleMediaConflictClear() {
    clearVideoMedia();
    clearPhotoMedia();
    setSubmitError(null);
  }

  function handleVideoReady(file: File, previewUrl: string, durationSec: number) {
    if (videoUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(videoUrlRef.current);
    }
    videoUrlRef.current = previewUrl;
    videoFileRef.current = file;
    setSubmitError(null);
    updateDraft({ videoPreviewUrl: previewUrl, videoDurationSec: durationSec });
  }

  function handleVideoClear() {
    clearVideoMedia();
    setSubmitError(null);
  }

  function handlePhotosAdd(files: File[], previewUrls: string[]) {
    photoFilesRef.current = [...photoFilesRef.current, ...files];
    photoUrlRefs.current = [...photoUrlRefs.current, ...previewUrls];
    setSubmitError(null);
    setDraft((prev) => ({
      ...prev,
      imagePreviewUrls: [...prev.imagePreviewUrls, ...previewUrls],
    }));
  }

  function handlePhotoRemove(index: number) {
    const url = photoUrlRefs.current[index];
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    photoUrlRefs.current = photoUrlRefs.current.filter((_, i) => i !== index);
    photoFilesRef.current = photoFilesRef.current.filter((_, i) => i !== index);
    setSubmitError(null);
    setDraft((prev) => ({
      ...prev,
      imagePreviewUrls: prev.imagePreviewUrls.filter((_, i) => i !== index),
    }));
  }

  function handlePhotosClear() {
    clearPhotoMedia();
    setSubmitError(null);
  }

  /** ローカル File はアップロードし、サーバ既存URLはそのまま使ってメディアURLを確定する */
  async function resolveImageUrls(): Promise<string[]> {
    const files = photoFilesRef.current;
    const urls = photoUrlRefs.current;
    const resolved: string[] = [];
    for (let i = 0; i < urls.length; i += 1) {
      const file = files[i];
      resolved.push(file ? await uploadPostFile(file, "image") : urls[i]);
    }
    return resolved;
  }

  async function resolveVideoUrl(durationSec: number): Promise<string | null> {
    if (videoFileRef.current) {
      return uploadPostFile(videoFileRef.current, "video", durationSec);
    }
    // File を持たない = サーバ既存URL（下書き復元）
    return draft.videoPreviewUrl;
  }

  /** 投稿を作成（新規）または既存下書きを更新（再開）し、投稿IDを返す */
  async function persistPost(
    status: "draft" | "public",
  ): Promise<string | null> {
    const mediaKind = getPostCreateMediaKind(draft);
    const areaLabel = getPostCreateAreaLabel(draft);
    const bodyWithExtras = appendDraftExtras(draft.body, draft);

    let mediaType: "image" | "video";
    let mediaUrl: string | null = null;
    let galleryImages: string[] = [];
    let durationSec: number | null = null;

    if (mediaKind === "image") {
      const urls = await resolveImageUrls();
      if (!urls.length) return null;
      mediaType = "image";
      [mediaUrl, ...galleryImages] = urls;
    } else if (mediaKind === "video") {
      if (draft.videoDurationSec == null) return null;
      mediaType = "video";
      durationSec = draft.videoDurationSec;
      mediaUrl = await resolveVideoUrl(durationSec);
    } else {
      return null;
    }

    if (!mediaUrl) return null;

    // 公開/非公開の投稿を編集中は元のステータスを維持する
    const nextStatus = keepStatusOnSave ? sourceStatus : status;

    const payload: Record<string, unknown> = {
      status: nextStatus,
      mediaType,
      category: draft.category,
      title: draft.title.trim(),
      body: bodyWithExtras,
      area: areaLabel,
      mediaUrl,
    };
    if (mediaType === "image") payload.galleryImages = galleryImages;
    if (mediaType === "video") payload.durationSec = durationSec;

    // 既存の下書きを再開している場合は更新、それ以外は新規作成
    if (draftId) {
      const res = await fetch(`/api/me/posts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
      return json.id ?? draftId;
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { id?: string; error?: string };
    if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
    return json.id ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const createdPostId = await persistPost("public");
      setDone(true);
      // 編集モードはマイアルバムへ、新規投稿は投稿詳細へ戻る
      const nextHref = isEditMode
        ? "/profile/posts"
        : createdPostId
          ? `/posts/${createdPostId}`
          : "/posts";
      setTimeout(() => router.push(nextHref), 900);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (draftSaving || submitting) return;
    if (getPostCreateMediaKind(draft) == null) {
      setSubmitError("下書きを保存するには、写真か動画を追加してください");
      return;
    }

    setDraftSaving(true);
    setDraftSaved(false);
    setSubmitError(null);

    try {
      const savedId = await persistPost("draft");
      // 新規保存なら以降は同じ下書きを更新できるよう ID を保持する
      if (savedId && !draftId) {
        setDraftId(savedId);
        loadedDraftIdRef.current = savedId;
        router.replace(`/posts/new?draft=${savedId}`);
      }
      setDraftsReloadToken((t) => t + 1);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2600);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "下書きの保存に失敗しました",
      );
    } finally {
      setDraftSaving(false);
    }
  }

  return (
    <div className="posts-create-page">
      <header className="posts-create-page__header">
        <div className="posts-create-page__header-main">
          <Link
            href={isEditMode ? "/profile/posts" : "/posts"}
            className="posts-create-page__back"
            aria-label={isEditMode ? "マイアルバムに戻る" : "みんなの投稿に戻る"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="posts-create-page__title-wrap">
            <h1 className="posts-create__heading">
              <Leaf className="posts-create-page__leaf" aria-hidden />
              {isEditMode
                ? "投稿を編集"
                : draftId
                  ? "下書きを編集"
                  : "投稿を作成"}
            </h1>
            <p className="posts-create-page__subtitle">
              {isEditMode
                ? "内容を編集して、変更を保存できます"
                : draftId
                  ? "続きから編集して、投稿または下書き保存できます"
                  : "写真または15秒動画で、まちの魅力を共有しましょう"}
            </p>
          </div>
        </div>
        <div className="posts-create-page__header-actions">
          {!isEditMode ? (
            <>
              <Link
                href="/profile/posts"
                className="posts-create-page__history"
                aria-label="マイアルバム"
              >
                <Images className="h-4 w-4" aria-hidden />
                <span className="posts-create-page__action-label">
                  <span className="posts-create-page__history-full">マイ</span>
                  アルバム
                </span>
              </Link>
              <PostCreateDraftControl
                drafts={drafts}
                activeDraftId={draftId}
                onSave={handleSaveDraft}
                saving={draftSaving}
                saved={draftSaved}
                disabled={draftSaving || submitting}
                isUpdate={Boolean(draftId)}
              />
            </>
          ) : null}
        </div>
      </header>

      {resumeLoading ? (
        <div className="posts-create-resume-loading">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {isEditMode ? "投稿を読み込み中…" : "下書きを読み込み中…"}
        </div>
      ) : null}

      <div className="posts-create-layout">
        <PostCreateForm
          draft={draft}
          onChange={updateDraft}
          onPhotosAdd={handlePhotosAdd}
          onPhotoRemove={handlePhotoRemove}
          onPhotosClear={handlePhotosClear}
          onSubmit={handleSubmit}
          onVideoReady={handleVideoReady}
          onVideoClear={handleVideoClear}
          onMediaConflictClear={handleMediaConflictClear}
          onPreview={() => setPreviewOpen(true)}
          submitting={submitting}
          done={done}
          canSubmit={canSubmit}
          submitError={submitError}
          submitLabel={isEditMode ? "変更を保存" : "投稿する"}
          submittingLabel={isEditMode ? "保存中…" : "アップロード中…"}
          doneTitle={isEditMode ? "変更を保存しました" : "投稿を受け付けました"}
          doneDescription={
            isEditMode ? "マイアルバムへ戻ります…" : "みんなの投稿へ戻ります…"
          }
        />
        <div className="posts-create-sidebar-wrap hidden min-[900px]:block">
          <PostCreateSidebar draft={draft} />
        </div>
      </div>

      <PostCreatePreviewSheet
        draft={draft}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

/** タグ・関連リンクは DB 未対応のため本文末尾に付与 */
function appendDraftExtras(body: string, draft: PostCreateDraft): string {
  const parts: string[] = [];
  const trimmed = body.trim();
  if (trimmed) parts.push(trimmed);

  if (draft.tags.length > 0) {
    parts.push(draft.tags.map((t) => `#${t}`).join(" "));
  }
  if (draft.relatedUrl.trim()) {
    parts.push(draft.relatedUrl.trim());
  }

  return parts.join("\n\n").slice(0, 1000);
}
