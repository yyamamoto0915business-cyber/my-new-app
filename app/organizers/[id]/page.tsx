import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerById } from "@/lib/db/organizers";
import { fetchPublishedEventsByOrganizer } from "@/lib/db/events";
import { EventThumbnail } from "@/components/event-thumbnail";
import { formatEventDateTime } from "@/lib/format-date";
import { Breadcrumb } from "@/components/breadcrumb";
import { CATEGORY_LABELS } from "@/lib/categories";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrganizerPublicPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    notFound();
  }

  const [organizer, events] = await Promise.all([
    getOrganizerById(supabase, id),
    fetchPublishedEventsByOrganizer(supabase, id, 20),
  ]);

  if (!organizer) {
    notFound();
  }

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.date >= today);
  const pastEvents = events.filter((e) => e.date < today);

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "イベント一覧", href: "/events" },
              {
                label:
                  organizer.organizationName.length > 20
                    ? `${organizer.organizationName.slice(0, 20)}…`
                    : organizer.organizationName,
              },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* 主催者情報 */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative aspect-[16/6] w-full bg-slate-100">
            {organizer.coverImageUrl ? (
              <Image
                src={organizer.coverImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end">
              <div className="shrink-0">
                {organizer.avatarUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm sm:h-24 sm:w-24">
                    <Image
                      src={organizer.avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-slate-100 text-2xl font-semibold text-slate-500 shadow-sm sm:h-24 sm:w-24"
                    aria-hidden
                  >
                    {organizer.organizationName.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {organizer.organizationName}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {organizer.activityArea && (
                    <p className="text-sm text-slate-500">{organizer.activityArea}</p>
                  )}
                </div>

                {organizer.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {organizer.categories.slice(0, 8).map((key) => (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        {CATEGORY_LABELS[key]}
                      </span>
                    ))}
                  </div>
                )}

                {organizer.shortBio && (
                  <p className="mt-4 text-sm font-medium text-slate-700">
                    {organizer.shortBio}
                  </p>
                )}

                {(organizer.websiteUrl ||
                  organizer.instagramUrl ||
                  organizer.xUrl ||
                  organizer.facebookUrl) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {organizer.websiteUrl && (
                      <a
                        href={organizer.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        公式サイト
                      </a>
                    )}
                    {organizer.instagramUrl && (
                      <a
                        href={organizer.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Instagram
                      </a>
                    )}
                    {organizer.xUrl && (
                      <a
                        href={organizer.xUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        X
                      </a>
                    )}
                    {organizer.facebookUrl && (
                      <a
                        href={organizer.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Facebook
                      </a>
                    )}
                  </div>
                )}

                {(organizer.publicEmail || organizer.publicPhone) && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      公開連絡先
                    </h2>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      {organizer.publicEmail && (
                        <p>
                          メール:{" "}
                          <a
                            href={`mailto:${organizer.publicEmail}`}
                            className="font-medium text-slate-700 underline-offset-2 hover:underline"
                          >
                            {organizer.publicEmail}
                          </a>
                        </p>
                      )}
                      {organizer.publicPhone && (
                        <p>
                          電話:{" "}
                          <a
                            href={`tel:${organizer.publicPhone}`}
                            className="font-medium text-slate-700 underline-offset-2 hover:underline"
                          >
                            {organizer.publicPhone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {organizer.bio && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 sm:p-5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      主催者について
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {organizer.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {organizer.galleryImages.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">ギャラリー</h2>
            <p className="mt-1 text-sm text-slate-500">
              主催者の活動や雰囲気が伝わる写真です
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {organizer.galleryImages.slice(0, 6).map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 220px"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 開催イベント一覧 */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            開催イベント
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            この主催者が開催するイベント一覧です
          </p>

          {upcomingEvents.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                現在予定されているイベントはありません
              </p>
              <Link
                href="/events"
                className="mt-4 inline-block text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
              >
                イベント一覧へ
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300/80 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-24 shrink-0 sm:w-32">
                    <EventThumbnail
                      imageUrl={event.imageUrl}
                      alt={event.title}
                      rounded="none"
                      fill
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatEventDateTime(event.date, event.startTime)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {event.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">過去のイベント</h2>
            <p className="mt-1 text-sm text-slate-500">
              これまでに開催したイベントです
            </p>
            <div className="mt-6 space-y-4">
              {pastEvents.slice(0, 12).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300/80 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] w-24 shrink-0 sm:w-32">
                    <EventThumbnail
                      imageUrl={event.imageUrl}
                      alt={event.title}
                      rounded="none"
                      fill
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <h3 className="font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatEventDateTime(event.date, event.startTime)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {event.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 pb-12">
          <Link
            href="/events"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            ← イベント一覧へ
          </Link>
        </div>
      </main>
    </div>
  );
}
