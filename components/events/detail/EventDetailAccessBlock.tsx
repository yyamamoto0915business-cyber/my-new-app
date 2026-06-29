import { ExternalLink, MapPinned } from "lucide-react";
import { getMapsUrl } from "@/lib/maps-url";
import { cn } from "@/lib/utils";

type Props = {
  location: string;
  address?: string;
  access?: string | null;
  latitude?: number;
  longitude?: number;
  /** compact = グリッドカード内 / default = 縦積みセクション */
  variant?: "default" | "compact";
  /** false のとき会場名・住所テキストを省略（地図とボタンのみ） */
  showVenueDetails?: boolean;
};

function buildEmbedUrl(
  location: string,
  address: string,
  latitude?: number,
  longitude?: number
): string {
  const query =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : [location, address].filter(Boolean).join(" ");
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=ja&z=15&output=embed`;
}

export function EventDetailAccessBlock({
  location,
  address = "",
  access,
  latitude,
  longitude,
  variant = "default",
  showVenueDetails = true,
}: Props) {
  const mapsHref = getMapsUrl({
    address: address || location,
    venueName: location,
    latitude,
    longitude,
    preferIOS: false,
  });

  if (!location && !address) return null;

  const isCompact = variant === "compact";

  const mapBlock = (
    <div
      className={cn(
        "relative bg-zinc-100",
        isCompact
          ? "h-[96px] w-full overflow-hidden rounded-lg"
          : "h-[140px] min-[900px]:min-h-[200px]"
      )}
    >
      <iframe
        title={`${location}の地図`}
        src={buildEmbedUrl(location, address, latitude, longitude)}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );

  const addressBlock = (
    <div
      className={cn(
        "flex flex-col gap-2",
        isCompact ? "pt-2" : "p-3 min-[900px]:p-5",
        !showVenueDetails && "flex-row items-center justify-between gap-3 py-2.5"
      )}
    >
      {showVenueDetails ? (
        <div className="flex items-start gap-2">
          <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-[var(--mg-ink)]">{location}</p>
            {address ? (
              <p className="mt-1 leading-relaxed text-[var(--mg-muted)]">{address}</p>
            ) : null}
            {!isCompact && access ? (
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--mg-muted)]">
                {access}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-[var(--ed-line)] bg-white px-3.5 text-sm font-semibold text-[var(--ed-forest,var(--ed-accent))] transition hover:bg-[var(--ed-accent-soft)]",
          !showVenueDetails && "shrink-0"
        )}
      >
        地図を開く
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );

  if (isCompact) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-2">
        {mapBlock}
        {addressBlock}
      </div>
    );
  }

  return (
    <section className="space-y-2 min-[900px]:space-y-4">
      <h2 className="sr-only text-base font-semibold text-[var(--mg-ink)] min-[900px]:not-sr-only min-[900px]:mb-0">
        アクセス
      </h2>
      <div className="ed-content-card overflow-hidden">
        <div className="grid min-[900px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {mapBlock}
          {addressBlock}
        </div>
      </div>
    </section>
  );
}
