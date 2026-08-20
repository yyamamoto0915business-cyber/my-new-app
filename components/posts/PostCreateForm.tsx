"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Send,
  Store,
  Sun,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PostCreateMediaInput } from "@/components/posts/PostCreateMediaInput";
import {
  POST_CREATE_ATMOSPHERE_CHIPS,
  POST_CREATE_BODY_MAX,
  POST_CREATE_TAG_LENGTH_MAX,
  POST_CREATE_TAG_MAX,
  POST_CREATE_TITLE_MAX,
  getPostCreateMediaKind,
  togglePostCreateTag,
  type PostCreateDraft,
} from "@/lib/posts/post-create-draft";
import {
  POST_CATEGORY_COLORS,
  POST_CATEGORY_TABS,
  type PostCategory,
} from "@/lib/posts/mock-feed";

const CREATE_CATEGORIES = POST_CATEGORY_TABS.filter((t) => t.key !== "all");

const CATEGORY_ICONS: Record<
  PostCategory,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  event: CalendarDays,
  shop: Store,
  spot: MapPin,
  kitchen: Truck,
  scenery: Sun,
};

type Props = {
  draft: PostCreateDraft;
  onChange: (patch: Partial<PostCreateDraft>) => void;
  onPhotosAdd: (files: File[], previewUrls: string[]) => void;
  onPhotoRemove: (index: number) => void;
  onPhotosClear: () => void;
  onVideoReady: (file: File, previewUrl: string, durationSec: number) => void;
  onVideoClear: () => void;
  onMediaConflictClear: () => void;
  onPreview: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  done: boolean;
  canSubmit: boolean;
  submitError?: string | null;
  /** 送信ボタンの文言（編集モードでは「変更を保存」など） */
  submitLabel?: string;
  /** 送信処理中の文言 */
  submittingLabel?: string;
  /** 完了パネルの見出し・説明（編集モードで差し替える） */
  doneTitle?: string;
  doneDescription?: string;
};

export function PostCreateForm({
  draft,
  onChange,
  onPhotosAdd,
  onPhotoRemove,
  onPhotosClear,
  onVideoReady,
  onVideoClear,
  onMediaConflictClear,
  onPreview,
  onSubmit,
  submitting,
  done,
  canSubmit,
  submitError,
  submitLabel = "投稿する",
  submittingLabel = "アップロード中…",
  doneTitle = "投稿を受け付けました",
  doneDescription = "みんなの投稿へ戻ります…",
}: Props) {
  const [tagDraft, setTagDraft] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaKind = getPostCreateMediaKind(draft);
  const hasMedia = mediaKind != null;
  const tagsFull = draft.tags.length >= POST_CREATE_TAG_MAX;

  const detailsFilledCount =
    (draft.spotName.trim() ? 1 : 0) +
    (draft.area.trim() ? 1 : 0) +
    (draft.relatedUrl.trim() ? 1 : 0) +
    (draft.tags.length > 0 ? 1 : 0);

  useEffect(() => {
    if (detailsFilledCount > 0) setDetailsOpen(true);
  }, [detailsFilledCount]);

  const autoGrow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // 下書き再開・編集で本文が後から入っても高さを合わせる
  useEffect(() => {
    autoGrow(bodyRef.current);
  }, [draft.body, autoGrow]);

  if (done) {
    return (
      <div className="posts-create__panel px-4 py-8 text-center">
        <p className="text-[14px] font-semibold text-[#1a3e28]">
          {doneTitle}
        </p>
        <p className="mt-1 text-[12px] text-[#3d5c48]">{doneDescription}</p>
      </div>
    );
  }

  function addTagFromInput() {
    const next = togglePostCreateTag(draft.tags, tagDraft);
    if (next !== draft.tags) {
      onChange({ tags: next });
      setTagDraft("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="posts-create-form">
      <div className="posts-create__panel space-y-2.5">
        <PostCreateMediaInput
          imagePreviewUrls={draft.imagePreviewUrls}
          videoPreviewUrl={draft.videoPreviewUrl}
          videoDurationSec={draft.videoDurationSec}
          onPhotosAdd={onPhotosAdd}
          onPhotoRemove={onPhotoRemove}
          onPhotosClear={onPhotosClear}
          onVideoReady={onVideoReady}
          onVideoClear={onVideoClear}
          onMediaConflictClear={onMediaConflictClear}
        />

        <fieldset className="posts-create-block posts-create-block--cat">
          <legend className="posts-create-block__label">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            カテゴリー
          </legend>
          <div className="posts-create-cat__pills flex flex-wrap gap-1.5">
            {CREATE_CATEGORIES.map((tab) => {
              const active = draft.category === tab.key;
              const Icon = CATEGORY_ICONS[tab.key as PostCategory];
              const color = POST_CATEGORY_COLORS[tab.key as PostCategory];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onChange({ category: tab.key as PostCategory })}
                  className={cn(
                    "posts-create-category-pill",
                    active && "posts-create-category-pill--active",
                  )}
                  style={
                    active
                      ? { backgroundColor: color, borderColor: color }
                      : { color }
                  }
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden />
                  <span className={active ? "" : "text-[#4a3e32]"}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="posts-create-row">
          <span className="posts-create-row__label">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            タイトル
            <span className="posts-create-form__toolbar-badge posts-create-form__toolbar-badge--inline">
              必須
            </span>
          </span>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            maxLength={POST_CREATE_TITLE_MAX}
            placeholder="例）週末に楽しめる公園のピクニック"
            className="posts-create-row__input"
            required
          />
          <span className="posts-create-row__count">
            {draft.title.length}/{POST_CREATE_TITLE_MAX}
          </span>
        </label>

        <label className="posts-create-row posts-create-row--top">
          <span className="posts-create-row__label">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            本文
          </span>
          <textarea
            ref={(el) => {
              bodyRef.current = el;
              autoGrow(el);
            }}
            value={draft.body}
            onChange={(e) => {
              onChange({ body: e.target.value });
              autoGrow(e.currentTarget);
            }}
            rows={1}
            maxLength={POST_CREATE_BODY_MAX}
            placeholder="あなたのおすすめや体験を教えてください…"
            className="posts-create-row__input posts-create-row__input--area"
          />
          <span className="posts-create-row__count">
            {draft.body.length}/{POST_CREATE_BODY_MAX}
          </span>
        </label>

        <div className="posts-create-details">
          <button
            type="button"
            className="posts-create-details__toggle"
            aria-expanded={detailsOpen}
            aria-controls="posts-create-details-body"
            onClick={() => setDetailsOpen((v) => !v)}
          >
            <span className="posts-create-details__title">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              詳細を追加
              <span className="posts-create-row__optional">任意</span>
            </span>
            {detailsFilledCount > 0 && !detailsOpen ? (
              <span className="posts-create-details__badge">
                {detailsFilledCount}項目入力済み
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "posts-create-details__chevron h-4 w-4",
                detailsOpen && "is-open",
              )}
              aria-hidden
            />
          </button>

          {detailsOpen ? (
            <div
              id="posts-create-details-body"
              className="posts-create-details__body"
            >
              <div className="posts-create-geo">
          <div className="posts-create-geo__head">
            <span className="posts-create-block__label posts-create-block__label--tight">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              位置情報を追加
              <span className="posts-create-row__optional">任意</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.locationEnabled}
              className={cn(
                "posts-create-location-toggle__switch",
                draft.locationEnabled && "is-on",
              )}
              onClick={() =>
                onChange({ locationEnabled: !draft.locationEnabled })
              }
            >
              <span className="posts-create-location-toggle__knob" aria-hidden />
            </button>
          </div>
          <div className="posts-create-duo">
            <label className="posts-create-row posts-create-row--half">
              <span className="posts-create-row__label">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                場所・スポット名
              </span>
              <input
                type="text"
                value={draft.spotName}
                onChange={(e) => onChange({ spotName: e.target.value })}
                placeholder="例）立川公園"
                className="posts-create-row__input"
                disabled={!draft.locationEnabled}
              />
            </label>

            <label className="posts-create-row posts-create-row--half">
              <span className="posts-create-row__label">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                住所またはエリア
              </span>
              <input
                type="text"
                value={draft.area}
                onChange={(e) => onChange({ area: e.target.value })}
                placeholder="例）東京都立川市緑町〜"
                className="posts-create-row__input"
                disabled={!draft.locationEnabled}
              />
            </label>
          </div>
        </div>

        <label className="posts-create-row">
          <span className="posts-create-row__label">
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            関連リンク
            <span className="posts-create-row__optional">任意</span>
          </span>
          <input
            type="url"
            value={draft.relatedUrl}
            onChange={(e) => onChange({ relatedUrl: e.target.value })}
            placeholder="例）公式サイトやSNSのURL"
            className="posts-create-row__input"
          />
          <ChevronRight className="posts-create-row__chevron h-4 w-4" aria-hidden />
        </label>

        <fieldset className="posts-create-block">
          <legend className="posts-create-block__label">
            <Sun className="h-3.5 w-3.5" aria-hidden />
            タグ・雰囲気
            <span className="posts-create-row__optional">任意</span>
          </legend>
          <p className="posts-create-block__hint">
            当てはまるものを選ぶ・自由に追加すると、見つけてもらいやすくなります
          </p>
          <div className="posts-create-tagfield">
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
              maxLength={POST_CREATE_TAG_LENGTH_MAX}
              placeholder="例）桜、ピクニック、子連れOK"
              className="posts-create-row__input"
              disabled={tagsFull}
            />
            <button
              type="button"
              className="posts-create-row__add"
              onClick={addTagFromInput}
              disabled={!tagDraft.trim() || tagsFull}
              aria-label="タグを追加"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="posts-create-atmosphere">
            {[...POST_CREATE_ATMOSPHERE_CHIPS, ...draft.tags]
              .filter((c, i, arr) => arr.indexOf(c) === i)
              .map((chip) => {
                const active = draft.tags.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    className={cn(
                      "posts-create-atmosphere__chip",
                      active && "is-active",
                    )}
                    onClick={() =>
                      onChange({ tags: togglePostCreateTag(draft.tags, chip) })
                    }
                  >
                    #{chip}
                  </button>
                );
              })}
          </div>
              </fieldset>
            </div>
          ) : null}
        </div>

        <div className="posts-create-actions">
          <button
            type="button"
            disabled={!hasMedia}
            onClick={onPreview}
            className="posts-create-actions__preview"
            title={
              hasMedia
                ? "投稿プレビューを見る"
                : "写真か動画を追加するとプレビューできます"
            }
          >
            <Eye className="h-4 w-4" aria-hidden />
            プレビュー
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "posts-create-actions__submit",
              !canSubmit && "posts-create-actions__submit--disabled",
            )}
          >
            <Send className="h-4 w-4" aria-hidden />
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>

        {submitError ? (
          <p className="posts-create-video__error text-center">{submitError}</p>
        ) : null}
      </div>
    </form>
  );
}
