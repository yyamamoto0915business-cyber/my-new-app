"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Banknote,
  CreditCard,
  ExternalLink,
  Minus,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import {
  POS_CATEGORIES,
  formatYen,
  type PosCartLine,
  type PosCategoryId,
  type PosPaymentMethod,
  type PosProduct,
  type PosSale,
  type PosSalesSummary,
} from "@/lib/pos/types";

type DayEvent = {
  id: string;
  title: string;
  date?: string | null;
};

type ProductFormState = {
  id?: string;
  name: string;
  priceYen: string;
  category: PosCategoryId;
  imageUrl: string | null;
};

const EMPTY_FORM: ProductFormState = {
  name: "",
  priceYen: "",
  category: "food",
  imageUrl: null,
};

function emptySummary(): PosSalesSummary {
  return {
    totalYen: 0,
    cashYen: 0,
    onlineYen: 0,
    saleCount: 0,
    platformFeeYen: 0,
    byProduct: [],
  };
}

export function OrganizerPosPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [summary, setSummary] = useState<PosSalesSummary>(emptySummary());
  const [recentSales, setRecentSales] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [productModal, setProductModal] = useState<"closed" | "create" | "edit">("closed");
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSummaryDetail, setShowSummaryDetail] = useState(false);
  const [pendingOnline, setPendingOnline] = useState<{
    saleId: string;
    checkoutUrl: string;
  } | null>(null);

  const loadSales = useCallback(async (eid: string) => {
    const qs = eid ? `?eventId=${encodeURIComponent(eid)}` : "";
    const res = await fetch(`/api/organizer/pos/sales${qs}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) return;
    setSummary(json.summary ?? emptySummary());
    setRecentSales(json.sales ?? []);
  }, []);

  const loadProducts = useCallback(async (eid: string) => {
    const qs = eid ? `?eventId=${encodeURIComponent(eid)}` : "";
    const res = await fetch(`/api/organizer/pos/products${qs}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "商品の取得に失敗しました");
    setProducts(json.products ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const evRes = await fetch("/api/organizer/day-events", { cache: "no-store" });
        const evJson = await evRes.json();
        if (cancelled) return;
        const list = (evJson.events ?? []) as DayEvent[];
        setEvents(list);
        const initialEvent = list[0]?.id ?? "";
        setEventId(initialEvent);
        await Promise.all([loadProducts(initialEvent), loadSales(initialEvent)]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProducts, loadSales]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadProducts(eventId), loadSales(eventId)]);
        if (!cancelled) setCart([]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps -- reload on event change only

  useEffect(() => {
    const paid = searchParams.get("paid");
    const saleId = searchParams.get("saleId");
    if (paid === "1" && saleId) {
      setMessage("オンライン決済が完了しました。");
      setCart([]);
      setPendingOnline(null);
      void loadSales(eventId);
    }
  }, [searchParams, eventId, loadSales]);

  useEffect(() => {
    if (!pendingOnline) return;
    const saleId = pendingOnline.saleId;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/organizer/pos/sales/${saleId}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.sale?.status === "paid") {
          setMessage("オンライン決済が完了しました。");
          setCart([]);
          setCashReceived("");
          setPendingOnline(null);
          await loadSales(eventId);
        }
      } catch {
        /* ignore poll errors */
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [pendingOnline, eventId, loadSales]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, category, query]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPriceYen * line.quantity, 0),
    [cart]
  );

  const cashReceivedNum = Number(cashReceived.replace(/[^\d]/g, "") || "0");
  const changeYen = Math.max(0, cashReceivedNum - subtotal);

  function addToCart(product: PosProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPriceYen: product.priceYen,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    });
    setError(null);
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + delta } : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setCashReceived("");
    setError(null);
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkingOut) return;
    setCheckingOut(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/organizer/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          eventId: eventId || null,
          lines: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          cashReceivedYen: paymentMethod === "cash" ? cashReceivedNum : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "会計に失敗しました");
        return;
      }

      if (paymentMethod === "cash") {
        setMessage(`会計完了：${formatYen(json.sale.totalYen)}`);
        clearCart();
        await loadSales(eventId);
      } else {
        const url = json.checkoutUrl as string;
        setPendingOnline({ saleId: json.sale.id, checkoutUrl: url });
        setMessage("QRコードをお客様に提示するか、決済ページを開いてください。");
      }
    } catch {
      setError("会計に失敗しました");
    } finally {
      setCheckingOut(false);
    }
  }

  function openCreateProduct() {
    setForm({ ...EMPTY_FORM });
    setProductModal("create");
  }

  function openEditProduct(product: PosProduct) {
    setForm({
      id: product.id,
      name: product.name,
      priceYen: String(product.priceYen),
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setProductModal("edit");
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/organizer/pos/images", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "画像のアップロードに失敗しました");
        return;
      }
      setForm((f) => ({ ...f, imageUrl: json.url }));
    } finally {
      setUploading(false);
    }
  }

  async function saveProduct() {
    if (savingProduct) return;
    const name = form.name.trim();
    const priceYen = Number(form.priceYen);
    if (!name) {
      setError("商品名を入力してください");
      return;
    }
    if (!Number.isFinite(priceYen) || priceYen < 0) {
      setError("価格を正しく入力してください");
      return;
    }
    setSavingProduct(true);
    setError(null);
    try {
      if (productModal === "edit" && form.id) {
        const res = await fetch(`/api/organizer/pos/products/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            priceYen,
            category: form.category,
            imageUrl: form.imageUrl,
            eventId: eventId || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "更新に失敗しました");
          return;
        }
      } else {
        const res = await fetch("/api/organizer/pos/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            priceYen,
            category: form.category,
            imageUrl: form.imageUrl,
            eventId: eventId || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "登録に失敗しました");
          return;
        }
      }
      setProductModal("closed");
      await loadProducts(eventId);
      setMessage(productModal === "edit" ? "商品を更新しました" : "商品を登録しました");
    } finally {
      setSavingProduct(false);
    }
  }

  async function removeProduct(productId: string) {
    if (!window.confirm("この商品を削除しますか？")) return;
    const res = await fetch(`/api/organizer/pos/products/${productId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "削除に失敗しました");
      return;
    }
    setCart((prev) => prev.filter((l) => l.productId !== productId));
    await loadProducts(eventId);
  }

  if (loading) {
    return (
      <div className="org-pos" aria-busy>
        <div className="org-pos__loading">レジを準備しています…</div>
      </div>
    );
  }

  return (
    <div className="org-pos">
      <header className="org-pos__topbar">
        <div className="min-w-0">
          <h1 className="org-pos__title">レジ・当日販売</h1>
          <p className="org-pos__subtitle">商品を選んで、その場で会計できます</p>
        </div>
        <div className="org-pos__event">
          <label htmlFor="pos-event" className="org-pos__event-label">
            対象イベント
          </label>
          <select
            id="pos-event"
            className="org-pos__event-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">共通（イベント未指定）</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
                {ev.date ? `（${ev.date}）` : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      {(message || error) && (
        <div
          className={cn("org-pos__banner", error ? "is-error" : "is-ok")}
          role="status"
        >
          <span>{error ?? message}</span>
          <button
            type="button"
            className="org-pos__banner-close"
            onClick={() => {
              setMessage(null);
              setError(null);
            }}
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {pendingOnline && (
        <div className="org-pos__online-wait">
          <div className="org-pos__online-wait-copy">
            <p>お客様のオンライン決済を待っています…</p>
            <p className="org-pos__muted">
              QRを読み取るか、決済ページを開いてお支払いください。
            </p>
            <div className="org-pos__online-wait-actions">
              <a
                href={pendingOnline.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="org-pos__link-btn"
              >
                決済ページを開く
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                className="org-pos__text-btn"
                onClick={() => setPendingOnline(null)}
              >
                閉じる
              </button>
            </div>
          </div>
          <div className="org-pos__qr" aria-hidden>
            <QRCodeSVG value={pendingOnline.checkoutUrl} size={128} level="M" />
          </div>
        </div>
      )}

      <div className="org-pos__layout">
        <section className="org-pos__catalog" aria-labelledby="pos-catalog-heading">
          <div className="org-pos__catalog-head">
            <h2 id="pos-catalog-heading">商品を選択</h2>
            <div className="org-pos__catalog-actions">
              <label className="org-pos__search">
                <Search className="h-4 w-4" aria-hidden />
                <input
                  type="search"
                  placeholder="商品を検索"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button type="button" className="org-pos__add-product" onClick={openCreateProduct}>
                <Plus className="h-4 w-4" />
                商品を追加
              </button>
            </div>
          </div>

          <div className="org-pos__cats" role="tablist" aria-label="カテゴリ">
            {POS_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                className={cn("org-pos__cat", category === c.id && "is-active")}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="org-pos__empty">
              <p>まだ商品がありません。</p>
              <button type="button" className="org-pos__add-product" onClick={openCreateProduct}>
                <Plus className="h-4 w-4" />
                最初の商品を登録
              </button>
            </div>
          ) : (
            <ul className="org-pos__grid">
              {filteredProducts.map((product) => (
                <li key={product.id}>
                  <div className="org-pos__product">
                    <button
                      type="button"
                      className="org-pos__product-main"
                      onClick={() => addToCart(product)}
                    >
                      <div className="org-pos__product-img">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            width={160}
                            height={160}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="org-pos__product-placeholder">{product.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <span className="org-pos__product-name">{product.name}</span>
                      <span className="org-pos__product-price">{formatYen(product.priceYen)}</span>
                    </button>
                    <div className="org-pos__product-tools">
                      <button
                        type="button"
                        aria-label="編集"
                        onClick={() => openEditProduct(product)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="削除"
                        onClick={() => void removeProduct(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="org-pos__summary">
            <div className="org-pos__summary-head">
              <h3>本日のサマリー</h3>
              <button
                type="button"
                className="org-pos__text-btn"
                onClick={() => setShowSummaryDetail((v) => !v)}
              >
                {showSummaryDetail ? "閉じる" : "詳細を見る"}
              </button>
            </div>
            <div className="org-pos__metrics">
              <div className="org-pos__metric">
                <span className="org-pos__metric-label">本日の売上</span>
                <span className="org-pos__metric-value">{formatYen(summary.totalYen)}</span>
              </div>
              <div className="org-pos__metric">
                <span className="org-pos__metric-label">現金</span>
                <span className="org-pos__metric-value">{formatYen(summary.cashYen)}</span>
              </div>
              <div className="org-pos__metric">
                <span className="org-pos__metric-label">オンライン</span>
                <span className="org-pos__metric-value">{formatYen(summary.onlineYen)}</span>
              </div>
              <div className="org-pos__metric">
                <span className="org-pos__metric-label">販売件数</span>
                <span className="org-pos__metric-value">{summary.saleCount}</span>
              </div>
            </div>
            {showSummaryDetail && (
              <div className="org-pos__summary-detail">
                <p className="org-pos__fee">
                  MachiGlyph手数料（オンライン）: {formatYen(summary.platformFeeYen)}
                </p>
                {summary.byProduct.length > 0 ? (
                  <ul className="org-pos__by-product">
                    {summary.byProduct.map((row) => (
                      <li key={`${row.productId ?? row.productName}`}>
                        <span>{row.productName}</span>
                        <span>
                          {row.quantity}点 / {formatYen(row.totalYen)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="org-pos__muted">まだ売上がありません</p>
                )}
                {recentSales.length > 0 && (
                  <ul className="org-pos__history">
                    {recentSales.slice(0, 8).map((sale) => (
                      <li key={sale.id}>
                        <span>
                          {sale.paymentMethod === "cash" ? "現金" : "オンライン"} ·{" "}
                          {formatYen(sale.totalYen)}
                        </span>
                        <span className="org-pos__muted">
                          {sale.paidAt
                            ? new Date(sale.paidAt).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        <aside className="org-pos__cart" aria-labelledby="pos-cart-heading">
          <div className="org-pos__cart-head">
            <h2 id="pos-cart-heading">ご注文内容</h2>
            <button
              type="button"
              className="org-pos__icon-btn"
              onClick={clearCart}
              disabled={cart.length === 0}
              aria-label="注文を取消"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {cart.length === 0 ? (
            <p className="org-pos__cart-empty">商品をタップして追加してください</p>
          ) : (
            <ul className="org-pos__cart-list">
              {cart.map((line) => (
                <li key={line.productId} className="org-pos__cart-line">
                  <div className="org-pos__cart-thumb">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span>{line.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="org-pos__cart-meta">
                    <span className="org-pos__cart-name">{line.name}</span>
                    <span className="org-pos__muted">{formatYen(line.unitPriceYen)}</span>
                  </div>
                  <div className="org-pos__qty">
                    <button type="button" onClick={() => updateQty(line.productId, -1)} aria-label="減らす">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => updateQty(line.productId, 1)} aria-label="増やす">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="org-pos__cart-line-total">
                    {formatYen(line.unitPriceYen * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="org-pos__cart-footer">
            <div className="org-pos__subtotal">
              <span>小計</span>
              <span>{formatYen(subtotal)}</span>
            </div>
            <div className="org-pos__total">
              <span>合計</span>
              <strong>{formatYen(subtotal)}</strong>
            </div>

            <fieldset className="org-pos__pay">
              <legend>お支払い方法</legend>
              <div className="org-pos__pay-options">
                <button
                  type="button"
                  className={cn("org-pos__pay-opt", paymentMethod === "cash" && "is-active")}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <Banknote className="h-4 w-4" />
                  現金
                </button>
                <button
                  type="button"
                  className={cn("org-pos__pay-opt", paymentMethod === "online" && "is-active")}
                  onClick={() => setPaymentMethod("online")}
                >
                  <CreditCard className="h-4 w-4" />
                  クレジット
                </button>
                <button
                  type="button"
                  className={cn(
                    "org-pos__pay-opt",
                    paymentMethod === "online" && "is-active is-qr"
                  )}
                  onClick={() => setPaymentMethod("online")}
                >
                  <QrCode className="h-4 w-4" />
                  QR・オンライン
                </button>
              </div>
            </fieldset>

            {paymentMethod === "cash" && (
              <div className="org-pos__cash">
                <label>
                  お預かり
                  <input
                    inputMode="numeric"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="0"
                  />
                </label>
                <div className="org-pos__change">
                  <span>おつり</span>
                  <strong>{formatYen(changeYen)}</strong>
                </div>
              </div>
            )}

            {paymentMethod === "online" && (
              <p className="org-pos__online-hint">
                Stripe Connect で決済します。MachiGlyph手数料 1% が差し引かれます。
              </p>
            )}

            <button
              type="button"
              className="org-pos__checkout"
              disabled={cart.length === 0 || checkingOut || (paymentMethod === "cash" && cashReceivedNum < subtotal)}
              onClick={() => void handleCheckout()}
            >
              {checkingOut
                ? "処理中…"
                : paymentMethod === "cash"
                  ? `${formatYen(subtotal)}を会計する`
                  : `${formatYen(subtotal)}をオンライン決済`}
            </button>
          </div>
        </aside>
      </div>

      {productModal !== "closed" && (
        <div className="org-pos__modal-backdrop" role="presentation">
          <div
            className="org-pos__modal"
            role="dialog"
            aria-modal
            aria-labelledby="pos-product-modal-title"
          >
            <div className="org-pos__modal-head">
              <h2 id="pos-product-modal-title">
                {productModal === "edit" ? "商品を編集" : "商品を追加"}
              </h2>
              <button
                type="button"
                className="org-pos__icon-btn"
                onClick={() => setProductModal("closed")}
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="org-pos__modal-body">
              <label className="org-pos__field">
                商品名
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例）揚げパン プレーン"
                />
              </label>
              <label className="org-pos__field">
                価格（円）
                <input
                  inputMode="numeric"
                  value={form.priceYen}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceYen: e.target.value.replace(/[^\d]/g, "") }))
                  }
                  placeholder="300"
                />
              </label>
              <label className="org-pos__field">
                カテゴリ
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as PosCategoryId }))
                  }
                >
                  {POS_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="org-pos__field">
                <span>商品画像</span>
                <div className="org-pos__image-row">
                  {form.imageUrl ? (
                    <Image
                      src={form.imageUrl}
                      alt=""
                      width={72}
                      height={72}
                      className="org-pos__image-preview"
                      unoptimized
                    />
                  ) : (
                    <div className="org-pos__image-preview is-empty">なし</div>
                  )}
                  <label className="org-pos__file-btn">
                    {uploading ? "アップロード中…" : "画像を選ぶ"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      hidden
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="org-pos__modal-foot">
              <button
                type="button"
                className="org-pos__text-btn"
                onClick={() => setProductModal("closed")}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="org-pos__checkout"
                disabled={savingProduct}
                onClick={() => void saveProduct()}
              >
                {savingProduct ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
