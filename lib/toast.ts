/**
 * 画面の中に出す小さな通知（トースト）。alert() の代わりに使う。
 * どこからでも showToast("…") で出せる。表示は components/ui/AppToaster.tsx（app/layout.tsx に1つだけ置く）。
 */
export type ToastType = "error" | "success" | "info";
export type ToastItem = { id: number; message: string; type: ToastType };

type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();
let seq = 0;

export function showToast(message: string, opts: { type?: ToastType } = {}): void {
  const item: ToastItem = { id: ++seq, message: String(message ?? ""), type: opts.type ?? "error" };
  if (listeners.size === 0) {
    // 表示の部品がまだないとき（ごく初めの読みこみ中）だけ、今までどおり小窓で出す
    if (typeof window !== "undefined") window.alert(item.message);
    return;
  }
  for (const l of listeners) l(item);
}

export function subscribeToasts(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
