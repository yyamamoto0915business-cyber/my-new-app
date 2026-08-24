"use client";

type Props = {
  message: string;
  onRetry: () => void;
};

export function FeedLoadError({ message, onRetry }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-2.5 rounded-[16px] border border-dashed border-[#e0d8cc] bg-white px-4 py-6 text-center"
      role="alert"
    >
      <p className="text-[13px] text-[#6a6258]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center rounded-full bg-[#163828] px-4 text-[12px] font-medium text-white"
      >
        再読み込み
      </button>
    </div>
  );
}
