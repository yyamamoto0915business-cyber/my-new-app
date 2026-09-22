"use client";

import { Images, LayoutGrid, MapPin } from "lucide-react";
import type { AlbumHubTab } from "@/lib/posts/my-album-view";
import { cn } from "@/lib/utils";

const TABS: { id: AlbumHubTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "posts", label: "投稿", icon: LayoutGrid },
  { id: "album", label: "アルバム", icon: Images },
  { id: "map", label: "マップ", icon: MapPin },
];

export function MyAlbumViewTabs({
  value,
  onChange,
}: {
  value: AlbumHubTab;
  onChange: (next: AlbumHubTab) => void;
}) {
  return (
    <nav className="mg-album-tabs" aria-label="アルバムの見方">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const on = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={cn("mg-album-tabs__item", on && "is-active")}
            aria-current={on ? "page" : undefined}
            onClick={() => onChange(tab.id)}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
