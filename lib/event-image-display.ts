/** next/image 許可ホスト（EventThumbnail と揃える） */
export const EVENT_IMAGE_ALLOWED_HOSTS = [
  "images.unsplash.com",
  "placehold.co",
  "i.imgur.com",
] as const;

export function isEventImageHostAllowed(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return EVENT_IMAGE_ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/** 幅÷高さがこの値以上なら横長として object-cover、未満は告知寄りで object-contain */
export const EVENT_FLYER_PORTRAIT_RATIO_THRESHOLD = 1.2;
