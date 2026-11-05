import { EventAnswersClient } from "@/components/organizer/events/EventAnswersClient";

export default function EventAnswersPage() {
  return (
    <main className="min-h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] bg-[#F5F8F5]">
      <EventAnswersClient />
    </main>
  );
}
