"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * /points の「レジで見せるQR」。主催者のレジで読み取ると、このイベントのポイントを使える。
 * 「商品と交換」のイベントは交換、「割引」のイベントはお会計の割引（discount があるとき）。
 */
export function PointsRegisterQr({
  value,
  title,
  balance,
  until,
  discount,
}: {
  value: string;
  title: string;
  balance: number;
  until: string;
  discount?: { label: string; maxYen: number | null };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.1rem] border border-[#ecd9a6] bg-gradient-to-br from-[#fffaf0] to-[#fdf0cf] px-4 py-5 text-center">
      <p className="m-0 text-[12px] font-semibold text-[#8a6a1c]">{title}</p>
      <p className="m-0 text-[28px] font-bold leading-none tabular-nums text-[#2f8f57]">
        {balance.toLocaleString("ja-JP")}
        <span className="ml-1 text-[13px] text-[#8a6a1c]">pt</span>
      </p>
      {discount ? (
        <p className="m-0 rounded-full bg-white/80 px-3 py-1 text-[13px] font-bold text-[#3a2c10]">{discount.label}</p>
      ) : null}
      <div className="rounded-xl bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
        <QRCodeSVG value={value} size={184} fgColor="#1a2818" bgColor="#ffffff" level="M" />
      </div>
      <p className="m-0 text-[12px] leading-relaxed text-[#6b5a33]">
        {discount
          ? `会場のレジでこのQRを見せると、ポイントでお会計が安くなります。${
              discount.maxYen != null ? `1回のお会計で ¥${discount.maxYen.toLocaleString("ja-JP")} まで。` : ""
            }`
          : "会場のレジでこのQRを見せると、ポイントで商品と交換できます。"}
        <br />
        {until}
      </p>
    </div>
  );
}
