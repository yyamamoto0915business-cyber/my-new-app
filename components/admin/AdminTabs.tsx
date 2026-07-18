"use client";

import Link from "next/link";

export type AdminTabItem = {
  id: string;
  label: string;
  href: string;
};

export function AdminTabs({
  tabs,
  activeId,
}: {
  tabs: AdminTabItem[];
  activeId: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1 border-b border-[#c8dcd0]">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`-mb-px border-b-2 px-2.5 py-1.5 text-xs transition ${
              active
                ? "border-[#1e3848] font-medium text-[#1e3848]"
                : "border-transparent text-[#5a7868] hover:text-[#0e1610]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
