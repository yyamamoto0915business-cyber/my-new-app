import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { OrganizerStoreManagementClient } from "@/components/organizer/stores/OrganizerStoreManagementClient";
import { createClient } from "@/lib/supabase/server";
import { fetchStoreById } from "@/lib/db/stores";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import { listMemoryStoreNews } from "@/lib/stores/memory-news";
import { listMemoryStoreMenu } from "@/lib/stores/memory-menu";
import { listMemoryStoreSchedules } from "@/lib/stores/memory-schedule";
import { DEMO_STORE_ID } from "@/lib/organizer/store-management-mock";
import { DEMO_KITCHEN_CAR_ID } from "@/lib/stores/draft-shell";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";
import type {
  StoreMenuRecord,
  StoreNewsRecord,
  StoreRecord,
  StoreScheduleRecord,
} from "@/lib/stores/types";

type Props = {
  params: Promise<{ id: string }>;
};

async function resolveStore(id: string): Promise<StoreRecord | null> {
  const fromMemory =
    getMemoryStoreById(id) ??
    (id === "demo" ? getMemoryStoreById(DEMO_KITCHEN_CAR_ID) : null);
  if (fromMemory) return fromMemory;

  const supabase = await createClient();
  if (!supabase) return null;
  try {
    return await fetchStoreById(supabase, id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const store = await resolveStore(id);
  return {
    title: store ? `${store.name} | キッチンカー管理` : "キッチンカー管理",
  };
}

export default async function OrganizerKitchenCarDetailPage({ params }: Props) {
  const { organizerRegistered } = await getOrganizerNavState();
  const { id } = await params;

  if (!organizerRegistered) {
    redirect(
      `/organizer?next=${encodeURIComponent(`/organizer/kitchen-cars/${id}`)}`,
    );
  }

  const initial = await resolveStore(id);
  if (!initial) notFound();

  if (initial.kind !== "kitchen_car") {
    redirect(`/organizer/stores/${initial.id}`);
  }

  const isMemory =
    Boolean(getMemoryStoreById(initial.id)) ||
    initial.id === DEMO_STORE_ID ||
    initial.id === DEMO_KITCHEN_CAR_ID ||
    initial.id.startsWith("store-mem-") ||
    initial.id.startsWith("demo-");

  const initialNews: StoreNewsRecord[] = isMemory
    ? listMemoryStoreNews(initial.id)
    : [];
  const initialMenu: StoreMenuRecord[] = isMemory
    ? listMemoryStoreMenu(initial.id)
    : [];
  const initialSchedules: StoreScheduleRecord[] = isMemory
    ? listMemoryStoreSchedules(initial.id)
    : [];

  return (
    <OrganizerPageShell
      variant="workspace"
      contentClassName="mx-auto w-full max-w-6xl space-y-4 pb-16 min-[900px]:pb-2"
    >
      <OrganizerStoreManagementClient
        storeId={initial.id}
        initialRecord={initial}
        initialNews={initialNews}
        initialMenu={initialMenu}
        initialSchedules={initialSchedules}
      />
    </OrganizerPageShell>
  );
}
