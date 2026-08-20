import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { StorePublicDetail } from "@/components/stores/detail/StorePublicDetail";
import { getStoreForPublicPage } from "@/lib/stores/get-store-for-public-page";
import { storeMenuRecordsToItems } from "@/lib/stores/demo-menu";

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

export default async function PublicStorePage({ params }: Props) {
  const { id } = await params;
  const data = await getStoreForPublicPage(id);
  if (!data) notFound();
  if (data.store.kind === "kitchen_car") {
    redirect(`/kitchen-cars/${id}`);
  }

  return (
    <main className="min-h-[70vh] bg-[#f7f9f6]">
      <StorePublicDetail
        store={data.store}
        news={data.news}
        menu={storeMenuRecordsToItems(data.menu)}
        events={data.events}
      />
    </main>
  );
}
