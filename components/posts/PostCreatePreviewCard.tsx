"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import {
  POST_CREATE_PREVIEW_PLACEHOLDER_IMAGE,
  getPostCategoryLabel,
  getPostCreateAreaLabel,
  getPostCreateMediaKind,
  getPostCreatePreviewTitle,
  type PostCreateDraft,
} from "@/lib/posts/post-create-draft";
import { formatVideoDuration } from "@/lib/posts/post-video";
import { POST_CATEGORY_COLORS } from "@/lib/posts/mock-feed";

type Props = {
  draft: PostCreateDraft;
};

export function PostCreatePreviewCard({ draft }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const categoryLabel = getPostCategoryLabel(draft.category);
  const badgeColor = POST_CATEGORY_COLORS[draft.category];
  const previewTitle = getPostCreatePreviewTitle(draft);
  const body = draft.body.trim();
  const area = getPostCreateAreaLabel(draft);
  const mediaKind = getPostCreateMediaKind(draft);
  const photos = draft.imagePreviewUrls;
  const hasVideo = mediaKind === "video";
  const hasPhotos = mediaKind === "image";
  const activePhoto = photos[photoIndex] ?? photos[0];

  return (
    <article className="posts-create-preview-card" aria-label="投稿プレビュー">
      <div className="posts-create-preview-card__media">
        {hasVideo && draft.videoPreviewUrl ? (
          <video
            src={draft.videoPreviewUrl}
            className="posts-create-preview-card__video"
            controls
            playsInline
            preload="metadata"
            muted
          />
        ) : hasPhotos && activePhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={activePhoto} alt="" className="posts-create-preview-card__photo" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={POST_CREATE_PREVIEW_PLACEHOLDER_IMAGE} alt="" />
        )}
        <span
          className="posts-create-preview-card__badge"
          style={{ backgroundColor: badgeColor }}
        >
          {categoryLabel}
        </span>
        {hasVideo && draft.videoDurationSec != null ? (
          <span className="posts-create-preview-card__duration">
            {formatVideoDuration(draft.videoDurationSec)}
          </span>
        ) : null}
        {hasPhotos && photos.length > 1 ? (
          <>
            <span className="posts-create-preview-card__gallery-count">
              {photoIndex + 1}/{photos.length}
            </span>
            <button
              type="button"
              className="posts-create-preview-card__nav posts-create-preview-card__nav--prev"
              aria-label="前の写真"
              onClick={() =>
                setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
              }
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="posts-create-preview-card__nav posts-create-preview-card__nav--next"
              aria-label="次の写真"
              onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>

      <div className="posts-create-preview-card__body">
        <div className="posts-create-preview-card__author">
          <span className="posts-create-preview-card__avatar" aria-hidden>
            あ
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#2a2218]">
              あなたの投稿
            </p>
            <p className="text-[10px] text-[#9a9088]">いま · 公開前</p>
          </div>
        </div>

        {draft.title.trim() || hasVideo || hasPhotos ? (
          <h3 className="posts-create-preview-card__title">{previewTitle}</h3>
        ) : (
          <div className="posts-create-preview-card__placeholder-title" aria-hidden />
        )}

        {body ? (
          <p className="posts-create-preview-card__excerpt">{body}</p>
        ) : !hasVideo && !hasPhotos ? (
          <div className="posts-create-preview-card__placeholder-lines" aria-hidden>
            <span />
            <span />
            <span className="posts-create-preview-card__placeholder-lines--short" />
          </div>
        ) : null}

        {draft.tags.length > 0 ? (
          <div className="posts-create-preview-card__tags">
            {draft.tags.slice(0, 4).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}

        <div className="posts-create-preview-card__meta">
          <MapPin className="h-3 w-3 shrink-0 text-[#8a6a48]" aria-hidden />
          <span className="truncate">
            {area || "場所・エリアを入力すると表示されます"}
          </span>
        </div>
      </div>
    </article>
  );
}
