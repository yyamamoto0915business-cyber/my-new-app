import { HomeOtonami } from "@/components/home-otonami";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <main className="relative z-10 flex-1">
        <HomeOtonami />
      </main>
    </div>
  );
}
