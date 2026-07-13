import { cn } from "@/lib/utils";

type Props = {
  dateLine: string;
  location: string;
  address?: string;
  priceLine: string;
  receptionLabel: string;
  receptionActive: boolean;
};

function InfoRow({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex gap-3.5">
      <span className="min-w-[34px] shrink-0 pt-[1px] text-[12px] text-[#8a9e80]">
        {label}
      </span>
      <span className={cn("text-[13px] leading-[1.55] text-[#2c3c2a]", valueClassName)}>
        {children}
      </span>
    </div>
  );
}

export function EventBasicInfo({
  dateLine,
  location,
  address,
  priceLine,
  receptionLabel,
  receptionActive,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <InfoRow label="日時">{dateLine}</InfoRow>
      <InfoRow label="場所">
        {location}
        {address ? (
          <span className="mt-0.5 block text-[11.5px] text-[#8a9e80]">{address}</span>
        ) : null}
      </InfoRow>
      <InfoRow label="費用">{priceLine}</InfoRow>
      <InfoRow
        label="受付"
        valueClassName={receptionActive ? "font-semibold text-[#348b38]" : undefined}
      >
        {receptionLabel}
      </InfoRow>
    </div>
  );
}
