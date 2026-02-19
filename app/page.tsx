import { FallingCherryBlossoms } from "@/components/falling-cherry-blossoms";
import { ModeSelectionScreen } from "@/components/mode-selection-screen";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <FallingCherryBlossoms />
      <main className="relative z-10 flex-1">
        <ModeSelectionScreen />
      </main>
    </div>
  );
}
