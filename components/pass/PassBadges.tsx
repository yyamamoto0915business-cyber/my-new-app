import {
  PAYMENT_STATUS_LABEL,
  RECEPTION_TYPE_LABEL,
  type ParticipationPass,
} from "@/lib/participation-pass";

const PAYMENT_CLASS: Record<ParticipationPass["paymentStatus"], string> = {
  paid: "border-[#b8dcc8] bg-[#eef6f0] text-[#2d7a4f]",
  free: "border-[#d0d8d2] bg-[#f4f6f4] text-[#4a584c]",
  onsite: "border-[#e4d8b8] bg-[#faf6ea] text-[#8a6a28]",
};

const RECEPTION_CLASS: Record<ParticipationPass["receptionType"], string> = {
  qr: "border-[#b8dcc8] bg-[#eef6f0] text-[#2d7a4f]",
  staff: "border-[#c8d0e0] bg-[#f0f2f8] text-[#3a4a68]",
};

export function PassPaymentBadge({
  status,
}: {
  status: ParticipationPass["paymentStatus"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10.5px] font-medium ${PAYMENT_CLASS[status]}`}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export function PassReceptionBadge({
  type,
}: {
  type: ParticipationPass["receptionType"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10.5px] font-medium ${RECEPTION_CLASS[type]}`}
    >
      {RECEPTION_TYPE_LABEL[type]}
    </span>
  );
}

export function PassQuantityBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d8ddd8] bg-[#f7f8f6] px-1.5 py-0.5 text-[10.5px] font-medium text-[#5a625a]">
      {label}
    </span>
  );
}
