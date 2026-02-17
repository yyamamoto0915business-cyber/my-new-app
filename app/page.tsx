import { FallingCherryBlossoms } from "@/components/falling-cherry-blossoms";
import { HomePageContent } from "@/components/home-page-content";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-6 sm:py-8">
      <FallingCherryBlossoms />
      <main className="relative z-10 w-full max-w-2xl space-y-6 lg:max-w-5xl xl:max-w-6xl">
        <HomePageContent />
      </main>
    </div>
  );
}
