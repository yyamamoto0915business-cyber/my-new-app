import { WelcomeHero } from "@/components/welcome/WelcomeHero";
import { RoleSelectionCards } from "@/components/welcome/RoleSelectionCards";
import { WelcomeFooterLinks } from "@/components/welcome/WelcomeFooterLinks";

export default function WelcomePage() {
  return (
    <main className="relative z-10">
      <section
        className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        aria-labelledby="welcome-heading"
      >
        {/* ごく薄い背景グラデーション（セクション内だけ） */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-b from-[#FFFBF2] via-white to-[#F5FAFF]"
          aria-hidden
        >
          <div className="absolute left-[-40px] top-[60px] h-40 w-40 rounded-full bg-amber-100/40 blur-3xl" />
          <div className="absolute right-[-32px] top-[32px] h-40 w-40 rounded-full bg-sky-100/40 blur-3xl" />
          <div className="absolute bottom-[-40px] left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-emerald-100/30 blur-3xl" />
        </div>

        <div className="relative rounded-[32px] border border-slate-100/80 bg-white/70 px-5 py-8 shadow-sm backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div id="welcome-heading" className="sr-only">
            MachiGlyph のはじめかた
          </div>

          <div className="space-y-8 sm:space-y-10">
            <WelcomeHero />

            <RoleSelectionCards />

            <div className="pt-2">
              <WelcomeFooterLinks />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
