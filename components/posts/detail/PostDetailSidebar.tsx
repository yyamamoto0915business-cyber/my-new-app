"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, Sprout } from "lucide-react";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";
import { AuthorAvatar } from "@/components/posts/AuthorAvatar";
import { type CommunityPost } from "@/lib/posts/mock-feed";
import {
  buildMapsEmbedUrl,
  classifyRelatedHref,
  isExternalRelatedHref,
  relatedLinkCtaLabel,
  relatedLinkHostLabel,
  relatedLinkTitle,
} from "@/lib/posts/related-link";

type Props = {
  post: CommunityPost;
  variant?: "desktop" | "mobile";
};

function RelatedLinkAction({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const external = isExternalRelatedHref(href);
  const className = "posts-place__link";
  const icon = external ? (
    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
        {icon}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
      {icon}
    </Link>
  );
}

function RelatedPlaceCard({ post }: { post: CommunityPost }) {
  const href = post.relatedHref?.trim();
  if (!href) return null;

  const kind = classifyRelatedHref(href);
  const areaLabel = post.areaLabel?.trim() || "";
  const cta = post.relatedLabel?.trim() || relatedLinkCtaLabel(kind);
  const embedUrl =
    kind === "map" ? buildMapsEmbedUrl(href, areaLabel) : null;
  const previewSrc =
    kind === "map"
      ? null
      : post.relatedImageUrl?.trim() || post.imageUrl;
  const nameLabel =
    kind === "map"
      ? areaLabel || relatedLinkHostLabel(href)
      : post.relatedTitle?.trim() ||
        post.relatedSiteName?.trim() ||
        relatedLinkHostLabel(href);

  return (
    <section className="posts-side-panel">
      <h2 className="posts-side-panel__title">{relatedLinkTitle(kind)}</h2>
      {embedUrl ? (
        <div className="posts-place-map posts-place-map--embed">
          <iframe
            title="この場所の地図"
            src={embedUrl}
            className="posts-place-map__frame"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : kind === "map" ? (
        <div className="posts-place-map" aria-hidden>
          <span className="posts-place-map__pin">
            <MapPin className="h-4 w-4" />
          </span>
        </div>
      ) : previewSrc ? (
        <div className="posts-place-map posts-place-map--photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt="" className="posts-place-map__photo" />
        </div>
      ) : null}
      <p className="posts-place__name">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {nameLabel}
      </p>
      <RelatedLinkAction href={href} label={cta} />
    </section>
  );
}

export function PostDetailSidebar({ post, variant = "desktop" }: Props) {
  const isMobile = variant !== "desktop";
  const albumHref = post.authorId ? `/users/${post.authorId}/album` : null;
  const relatedCard = <RelatedPlaceCard post={post} />;

  if (isMobile) {
    if (!post.relatedHref?.trim()) return null;
    return (
      <aside className="posts-detail-sidebar posts-detail-sidebar--mobile">
        {relatedCard}
      </aside>
    );
  }

  return (
    <aside className="posts-detail-sidebar">
      {relatedCard}

      <section className="posts-side-panel posts-side-panel--author">
        <h2 className="posts-side-panel__title">投稿者</h2>
        <div className="posts-author-card">
          {albumHref ? (
            <Link
              href={albumHref}
              className="posts-author-card__avatar"
              aria-label={`${post.authorName}のアルバム`}
            >
              <AuthorAvatar name={post.authorName} src={post.authorAvatarUrl} />
            </Link>
          ) : (
            <span className="posts-author-card__avatar" aria-hidden>
              <AuthorAvatar name={post.authorName} src={post.authorAvatarUrl} />
            </span>
          )}
          <div className="posts-author-card__meta">
            {albumHref ? (
              <Link href={albumHref} className="posts-author-card__name">
                {post.authorName}
              </Link>
            ) : (
              <p className="posts-author-card__name">{post.authorName}</p>
            )}
            <AuthorFollowButton authorId={post.authorId} />
          </div>
        </div>
      </section>

      <section className="posts-side-cta">
        <div className="posts-side-cta__body">
          <p className="posts-side-cta__eyebrow">
            <Sprout className="h-3.5 w-3.5" aria-hidden />
            まちの瞬間を、記録しよう
          </p>
          <p className="posts-side-cta__desc">
            見つけた景色や特別をシェアして、まちの魅力を一緒に広げませんか。
          </p>
          <Link href="/posts/new" className="posts-side-cta__link">
            みんなの投稿をはじめる
          </Link>
        </div>
      </section>
    </aside>
  );
}
