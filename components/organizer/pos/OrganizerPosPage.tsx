"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Banknote,
  CreditCard,
  ExternalLink,
  Maximize2,
  Minimize2,
  Minus,
  Nfc,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { usePosFocusMode } from "@/hooks/use-pos-focus-mode";
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

const PAYOUTS_HREF = "/organizer/settings/payouts";

/** 画面上の支払い選択。カードタッチは iOS アプリが必要なため、会計APIには送らない */
type PosPayChoice = PosPaymentMethod | "tap";

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
  const { focus, toggleFocus } = usePosFocusMode();
  const [events, setEvents] = useState<DayEvent[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PosPayChoice>("cash");
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
  const [pendingTap, setPendingTap] = useState<{
    saleId: string;
    appLink: string;
  } | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeSubmitted, setStripeSubmitted] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const [stripeStatusReady, setStripeStatusReady] = useState(false);
  const [posTapConfigured, setPosTapConfigured] = useState(false);
  const [refundingSaleId, setRefundingSaleId] = useState<string | null>(null);

  const loadSales = useCallback(async (eid: string) => {
    const qs = eid ? `?eventId=${encodeURIComponent(eid)}` : "";
    const res = await fetch(`/api/organizer/pos/sales${qs}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) return;
    setSummary(json.summary ?? emptySummary());
    setRecentSales(json.sales ?? []);
  }, []);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/organizer/pos/products", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "商品の取得に失敗しました");
    setProducts(json.products ?? []);
  }, []);

  const loadStripeStatus = useCallback(async () => {
    const res = await fetch("/api/organizer/billing", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) return null;
    const ready = Boolean(json.organizer?.stripe_account_charges_enabled);
    const submitted = Boolean(json.organizer?.stripe_account_details_submitted);
    setStripeReady(ready);
    setStripeSubmitted(submitted);
    setStripeConfigured(json.stripeConnectConfigured !== false);
    setPosTapConfigured(Boolean(json.posTapConfigured));
    setStripeStatusReady(true);
    return { ready, submitted };
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
        await Promise.all([loadProducts(), loadSales(initialEvent), loadStripeStatus()]);
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
  }, [loadProducts, loadSales, loadStripeStatus]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      try {
        await loadSales(eventId);
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
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps -- reload sales on event change only

  useEffect(() => {
    const paid = searchParams.get("paid");
    const saleId = searchParams.get("saleId");
    if (paid === "1" && saleId) {
      setMessage("スマホ決済が完了しました。");
      setCart([]);
      setPendingOnline(null);
      setPendingTap(null);
      void loadSales(eventId);
    }

    const connected = searchParams.get("connected");
    const refresh = searchParams.get("refresh");
    if (connected === "1") {
      void (async () => {
        const status = await loadStripeStatus();
        setPaymentMethod("online");
        if (status?.ready) {
          setMessage("スマホ決済の受取設定が完了しました。");
        } else if (status?.submitted) {
          setMessage("情報を送りました。審査が終わるまで、現金で会計できます。");
        } else {
          setMessage("設定がまだ完了していません。売上受取設定から続きを行ってください。");
        }
      })();
    } else if (refresh === "1") {
      setMessage("設定が途中です。売上受取設定から続きを行ってください。");
      setPaymentMethod("online");
      void loadStripeStatus();
    }
  }, [searchParams, eventId, loadSales, loadStripeStatus]);

  useEffect(() => {
    const pending = pendingOnline ?? pendingTap;
    if (!pending) return;
    const saleId = pending.saleId;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/organizer/pos/sales/${saleId}`, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.sale?.status === "paid") {
          setMessage(pendingTap ? "カードタッチが完了しました。" : "スマホ決済が完了しました。");
          setCart([]);
          setCashReceived("");
          setPendingOnline(null);
          setPendingTap(null);
          await loadSales(eventId);
        }
      } catch {
        /* ignore poll errors */
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [pendingOnline, pendingTap, eventId, loadSales]);

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

  async function handleRefund(sale: PosSale) {
    if (refundingSaleId || sale.status !== "paid") return;
    const methodLabel =
      sale.paymentMethod === "cash"
        ? "現金"
        : sale.paymentMethod === "tap"
          ? "カードタッチ"
          : "スマホ決済";
    const ok = window.confirm(
      sale.paymentMethod === "cash"
        ? `${formatYen(sale.totalYen)}の現金会計を返金済みにします。お客様へ現金をお戻しのうえ、よろしいですか？`
        : `${formatYen(sale.totalYen)}の${methodLabel}決済を全額返金します。よろしいですか？`
    );
    if (!ok) return;

    setRefundingSaleId(sale.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/organizer/pos/sales/${sale.id}/refund`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "返金に失敗しました");
        return;
      }
      setMessage(json.message || "返金が完了しました");
      await loadSales(eventId);
      setShowSummaryDetail(true);
    } catch {
      setError("返金に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setRefundingSaleId(null);
    }
  }

  async function handleCheckout() {
    if (cart.length === 0 || checkingOut) return;
    if ((paymentMethod === "online" || paymentMethod === "tap") && !stripeReady) {
      setError("カード・タッチ決済には受取設定が必要です。売上受取設定から設定してください。");
      return;
    }
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
      } else if (paymentMethod === "tap") {
        const appLink = json.appLink as string;
        setPendingTap({ saleId: json.sale.id, appLink });
        setMessage("iPhoneアプリを開き、カードをかざしてください。");
        if (appLink) {
          window.location.href = appLink;
        }
      } else {
        const url = json.checkoutUrl as string;
        setPendingOnline({ saleId: json.sale.id, checkoutUrl: url });
        setMessage("QRをお客様のスマホで読み取ってもらい、Apple Pay または Google Pay で支払ってもらってください。");
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
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "登録に失敗しました");
          return;
        }
      }
      setProductModal("closed");
      await loadProducts();
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
    await loadProducts();
  }

  if (loading) {
    return (
      <div className="org-pos" aria-busy>
        <div className="org-pos__loading">レジを準備しています…</div>
      </div>
    );
  }

  return (
    <div className={cn("org-pos", focus && "is-focus")} data-pos-focus={focus ? "true" : "false"}>
      <header className="org-pos__topbar">
        <div className="org-pos__topbar-lead">
          <h1 className="org-pos__title">レジ・当日販売</h1>
          <button
            type="button"
            className="org-pos__focus-btn"
            onClick={toggleFocus}
            aria-pressed={focus}
          >
            {focus ? (
              <Minimize2 className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            )}
            {focus ? "メニューを表示" : "全体表示"}
          </button>
        </div>
        <div className="org-pos__event">
          <label htmlFor="pos-event" className="org-pos__event-label">
            記録するイベント
          </label>
          <select
            id="pos-event"
            className="org-pos__event-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">指定しない</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
                {ev.date ? `（${ev.date}）` : ""}
              </option>
            ))}
          </select>
        </div>
      </header>

      {stripeStatusReady && !stripeReady && (
        <div
          className={cn(
            "org-pos__setup",
            stripeSubmitted && "is-pending",
            !stripeConfigured && "is-muted"
          )}
          role="status"
        >
          <div className="org-pos__setup-icon" aria-hidden>
            {stripeSubmitted ? (
              <CreditCard className="h-4 w-4" strokeWidth={1.9} />
            ) : (
              <QrCode className="h-4 w-4" strokeWidth={1.9} />
            )}
          </div>
          <p className="org-pos__setup-title">
            {!stripeConfigured
              ? "いまスマホ決済は使えません。現金なら会計できます。"
              : stripeSubmitted
                ? "審査中です。終わるまで現金で会計できます。"
                : "受取設定をすると、スマホのタッチ決済で会計できます"}
          </p>
          {stripeConfigured && (
            <div className="org-pos__setup-actions">
              <Link href={PAYOUTS_HREF} className="org-pos__setup-btn">
                {stripeSubmitted ? "設定を確認" : "受取設定をはじめる"}
              </Link>
            </div>
          )}
        </div>
      )}

      {(message || error) && (
        <div
          className={cn("org-pos__banner", error ? "is-error" : "is-ok")}
          role="status"
        >
          <div className="org-pos__banner-body">
            <span>{error ?? message}</span>
          </div>
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

      {pendingTap && (
        <div className="org-pos__online-wait">
          <div className="org-pos__online-wait-copy">
            <p>カードのタッチを待っています…</p>
            <p className="org-pos__muted">
              主催者用 iPhone アプリを開き、Visa などのカードを端末の上部にかざしてください。Suica・iD・QUICPay は使えません。
            </p>
            <div className="org-pos__online-wait-actions">
              <a href={pendingTap.appLink} className="org-pos__link-btn">
                iPhoneアプリを開く
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                className="org-pos__text-btn"
                onClick={() => setPendingTap(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingOnline && (
        <div className="org-pos__online-wait">
          <div className="org-pos__online-wait-copy">
            <p>お客様のスマホ決済を待っています…</p>
            <p className="org-pos__muted">
              QRをお客様のスマホで読み取ってもらってください。決済画面では Apple Pay または Google Pay を選ぶと、カード番号の入力は不要です。
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

      <section className="org-pos__summary" aria-labelledby="pos-summary-heading">
        <div className="org-pos__summary-head">
          <h2 id="pos-summary-heading" className="org-pos__summary-title">
            本日のサマリー
          </h2>
          <div className="org-pos__metrics">
            <div className="org-pos__metric">
              <span className="org-pos__metric-label">売上</span>
              <span className="org-pos__metric-value">{formatYen(summary.totalYen)}</span>
            </div>
            <div className="org-pos__metric">
              <span className="org-pos__metric-label">現金</span>
              <span className="org-pos__metric-value">{formatYen(summary.cashYen)}</span>
            </div>
            <div className="org-pos__metric">
              <span className="org-pos__metric-label">スマホ</span>
              <span className="org-pos__metric-value">{formatYen(summary.onlineYen)}</span>
            </div>
            <div className="org-pos__metric">
              <span className="org-pos__metric-label">件数</span>
              <span className="org-pos__metric-value">{summary.saleCount}</span>
            </div>
          </div>
          <button
            type="button"
            className="org-pos__text-btn"
            onClick={() => setShowSummaryDetail((v) => !v)}
          >
            {showSummaryDetail ? "閉じる" : "詳細"}
          </button>
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
                {recentSales.slice(0, 12).map((sale) => {
                  const isRefunded = sale.status === "refunded";
                  const isRefunding = refundingSaleId === sale.id;
                  return (
                    <li key={sale.id} className={cn(isRefunded && "is-refunded")}>
                      <div className="org-pos__history-main">
                        <span>
                          {sale.paymentMethod === "cash"
                            ? "現金"
                            : sale.paymentMethod === "tap"
                              ? "カードタッチ"
                              : "スマホ決済"} ·{" "}
                          {formatYen(sale.totalYen)}
                          {isRefunded ? (
                            <span className="org-pos__history-badge">返金済み</span>
                          ) : null}
                        </span>
                        <span className="org-pos__muted">
                          {sale.paidAt
                            ? new Date(sale.paidAt).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      {sale.status === "paid" ? (
                        <button
                          type="button"
                          className="org-pos__refund-btn"
                          disabled={isRefunding || refundingSaleId != null}
                          onClick={() => void handleRefund(sale)}
                        >
                          {isRefunding ? "返金中…" : "返金"}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>

      <div className="org-pos__layout">
        <section className="org-pos__catalog" aria-labelledby="pos-catalog-heading">
          <div className="org-pos__catalog-head">
            <h2 id="pos-catalog-heading">商品を選択</h2>
            <div className="org-pos__catalog-actions">
              {products.length > 0 && (
                <label className="org-pos__search">
                  <Search className="h-4 w-4" aria-hidden />
                  <input
                    type="search"
                    placeholder="商品を検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
              <button type="button" className="org-pos__add-product" onClick={openCreateProduct}>
                <Plus className="h-4 w-4" />
                商品を追加
              </button>
            </div>
          </div>

          {products.length > 0 && (
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
          )}

          {filteredProducts.length === 0 ? (
            <div className="org-pos__empty">
              {products.length === 0 ? (
                <>
                  <p className="org-pos__empty-title">まだ商品がありません</p>
                  <p className="org-pos__empty-lead">
                    一度登録すれば、次のイベントでもそのまま使えます。
                  </p>
                  <button type="button" className="org-pos__add-product" onClick={openCreateProduct}>
                    <Plus className="h-4 w-4" />
                    最初の商品を登録
                  </button>
                </>
              ) : (
                <p className="org-pos__empty-title">この条件の商品はありません</p>
              )}
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
        </section>

        <aside
          className={cn("org-pos__cart", cart.length === 0 && "is-empty")}
          aria-labelledby="pos-cart-heading"
        >
          <div className="org-pos__cart-head">
            <h2 id="pos-cart-heading">ご注文内容</h2>
            {cart.length > 0 && (
              <button
                type="button"
                className="org-pos__icon-btn"
                onClick={clearCart}
                aria-label="注文を取消"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="org-pos__cart-empty">
              {products.length === 0
                ? "商品を登録すると、ここに注文が入ります"
                : "商品をタップして追加してください"}
            </p>
          ) : (
            <>
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
                  <div className="org-pos__pay-options org-pos__pay-options--3">
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
                      <span className="org-pos__pay-icons" aria-hidden>
                        <QrCode className="h-4 w-4" />
                      </span>
                      スマホ払い
                    </button>
                    <button
                      type="button"
                      className={cn("org-pos__pay-opt", paymentMethod === "tap" && "is-active")}
                      onClick={() => setPaymentMethod("tap")}
                    >
                      <Nfc className="h-4 w-4" />
                      カードタッチ
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

                {paymentMethod === "online" && stripeReady && (
                  <p className="org-pos__online-hint">
                    お客様のスマホでQRを読み、Apple Pay または Google Pay で支払ってもらいます。カード番号の手入力は不要です。手数料1%のあと、売上はだいたい週1回、登録口座へ振り込まれます。
                  </p>
                )}

                {paymentMethod === "tap" && (
                  <div className="org-pos__tap-help">
                    <p className="org-pos__tap-help-title">Visaなどを、このiPhoneにかざす決済です</p>
                    <p>
                      {posTapConfigured
                        ? "ウェブで会計したあと、主催者用 iPhone アプリを開き、カードをかざします。Suica・iD・QUICPay は対象外です。"
                        : "カードタッチの店舗設定がまだです。いまはスマホ払いを使ってください。"}
                    </p>
                    <p>
                      アプリが手元にない場合は、お客さんのスマホ払い（Apple Pay / Google Pay）を使ってください。
                    </p>
                    {stripeReady ? (
                      <button
                        type="button"
                        className="org-pos__setup-btn"
                        onClick={() => setPaymentMethod("online")}
                      >
                        スマホ払いに切り替える
                      </button>
                    ) : (
                      <p>
                        スマホ払いにも、売上受取設定が必要です。
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === "online" && !stripeReady && (
                  <div className="org-pos__stripe-help">
                    <p>
                      {stripeSubmitted
                        ? "審査が終わるまで、現金で会計できます。"
                        : "受取設定が必要です。売上受取設定から口座と本人確認を済ませてください。"}
                    </p>
                    {stripeConfigured && (
                      <div className="org-pos__setup-actions">
                        <Link href={PAYOUTS_HREF} className="org-pos__setup-btn">
                          {stripeSubmitted ? "設定を確認" : "受取設定をはじめる"}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className="org-pos__checkout"
                  disabled={
                    checkingOut ||
                    (paymentMethod === "cash" && cashReceivedNum < subtotal) ||
                    ((paymentMethod === "online" || paymentMethod === "tap") && !stripeReady) ||
                    (paymentMethod === "tap" && !posTapConfigured)
                  }
                  onClick={() => void handleCheckout()}
                >
                  {checkingOut
                    ? "処理中…"
                    : paymentMethod === "cash"
                      ? `${formatYen(subtotal)}を会計する`
                      : paymentMethod === "tap"
                        ? !stripeReady
                          ? "受取設定が必要です"
                          : !posTapConfigured
                            ? "店舗設定が必要です"
                            : `${formatYen(subtotal)}でカードを待つ`
                        : stripeReady
                          ? `${formatYen(subtotal)}のQRを出す`
                          : "受取設定が必要です"}
                </button>
              </div>
            </>
          )}
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
              <p className="org-pos__modal-lead">
                登録した商品は、どのイベントでも使い回せます。
              </p>
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
