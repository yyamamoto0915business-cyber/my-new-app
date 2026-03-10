import { createClient } from "@/lib/supabase/server";
import { fetchFeaturedOrganizers } from "@/lib/db/organizers";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

export default async function OrganizersPage() {
  const supabase = await createClient();
  const organizers = supabase
    ? await fetchFeaturedOrganizers(supabase, 24)
    : [];

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "主催者一覧" },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            地域で活動する主催者
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            イベントを開催している団体・個人を探せます
          </p>
        </div>

        {organizers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              現在、公開中の主催者情報はありません
            </p>
            <Link
              href="/events"
              className="mt-4 inline-block text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
            >
              イベント一覧を見る
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizers.map((org) => (
              <Link
                key={org.id}
                href={`/organizers/${org.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300/80 hover:shadow-md sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {org.avatarUrl ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100 sm:h-14 sm:w-14">
                        <Image
                          src={org.avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-500 sm:h-14 sm:w-14"
                        aria-hidden
                      >
                        {org.organizationName.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900 group-hover:text-slate-700">
                      {org.organizationName}
                    </h2>
                    {org.region && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {org.region}
                      </p>
                    )}
                    {org.bio && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {org.bio}
                      </p>
                    )}
                  </div>
                </div>
                {org.eventCount > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    開催イベント {org.eventCount}件
                  </p>
                )}
                <span className="mt-4 inline-flex items-center text-sm font-medium text-slate-600 group-hover:text-slate-800">
                  プロフィールを見る →
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 pb-12">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            ← トップへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
