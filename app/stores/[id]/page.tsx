import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { StoreHomepage } from "@/components/stores/detail/StoreHomepage";
import { getStoreHomepageOrganizer } from "@/lib/stores/store-homepage-organizer";
import { getStoreForPublicPage } from "@/lib/stores/get-store-for-public-page";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getStoreForPublicPage(id);
  return {
    title: data ? `${data.store.name} | MachiGlyph` : "店舗 | MachiGlyph",
    description: data?.store.tagline ?? data?.store.description ?? undefined,
  };
}

import { ListingViewBeacon } from "@/components/analytics/ListingViewBeacon";

export default async function PublicStorePage({ params }: Props) {
  const { id } = await params;
  const data = await getStoreForPublicPage(id);
  if (!data) notFound();
  if (data.store.kind === "kitchen_car") {
    redirect(`/kitchen-cars/${id}`);
  }
  const organizer = await getStoreHomepageOrganizer(data.store.organizerId);

  return (
    <main className="min-h-[70vh] bg-[#f7f9f6]">
      <ListingViewBeacon kind="store" id={id} />
      <StoreHomepage
        store={data.store}
        news={data.news}
        menu={data.menu}
        events={data.events}
        organizer={organizer}
      />
    </main>
  );
}
