"use client";

import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import { VolunteerCard } from "./volunteer-card";
import { GlyphBadgeDot } from "./glyph/glyph-badge-dot";
import { GlyphCardShell } from "./glyph/glyph-card-shell";
import { GlyphDividerDots } from "./glyph/glyph-divider-dots";

type Props = {
  roles: VolunteerRoleWithEvent[];
  maxItems?: number;
};

export function VolunteerEmergencySection({ roles, maxItems = 5 }: Props) {
  const emergencyRoles = roles.filter((r) => r.emergency?.isEmergency === true);
  if (emergencyRoles.length === 0) return null;

  const displayed = emergencyRoles.slice(0, maxItems);

  return (
    <section className="mb-8">
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <GlyphBadgeDot variant="emergency">緊急</GlyphBadgeDot>
          <h2 className="font-serif text-lg font-semibold text-[var(--mg-ink)] dark:text-[var(--mg-ink)]">
            緊急募集
          </h2>
        </div>
        <GlyphDividerDots className="mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((r) => (
          <GlyphCardShell key={r.id}>
            <VolunteerCard role={r} priority />
          </GlyphCardShell>
        ))}
      </div>
    </section>
  );
}
