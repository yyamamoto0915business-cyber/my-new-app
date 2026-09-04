import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calcPosOrganizerNetYen,
  calcPosPlatformFeeYen,
} from "@/lib/pos/fee";
import type {
  PosCategoryId,
  PosPaymentMethod,
  PosProduct,
  PosSale,
  PosSaleItem,
  PosSalesSummary,
} from "@/lib/pos/types";

type DbClient = SupabaseClient;

type ProductRow = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  name: string;
  price_yen: number;
  category: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type SaleRow = {
  id: string;
  organizer_id: string;
  event_id: string | null;
  payment_method: string;
  status: string;
  total_yen: number;
  cash_received_yen: number | null;
  cash_change_yen: number | null;
  platform_fee_yen: number;
  organizer_net_yen: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
};

type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_yen: number;
  quantity: number;
  line_total_yen: number;
};

function mapProduct(row: ProductRow): PosProduct {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    eventId: row.event_id,
    name: row.name,
    priceYen: row.price_yen,
    category: (row.category as PosCategoryId) || "other",
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSaleItem(row: SaleItemRow): PosSaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    productName: row.product_name,
    unitPriceYen: row.unit_price_yen,
    quantity: row.quantity,
    lineTotalYen: row.line_total_yen,
  };
}

function mapSale(row: SaleRow, items?: PosSaleItem[]): PosSale {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    eventId: row.event_id,
    paymentMethod: row.payment_method as PosPaymentMethod,
    status: row.status as PosSale["status"],
    totalYen: row.total_yen,
    cashReceivedYen: row.cash_received_yen,
    cashChangeYen: row.cash_change_yen,
    platformFeeYen: row.platform_fee_yen,
    organizerNetYen: row.organizer_net_yen,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    items,
  };
}

export async function listPosProducts(
  supabase: DbClient,
  organizerId: string,
  opts?: { eventId?: string | null; activeOnly?: boolean }
): Promise<PosProduct[]> {
  let q = supabase
    .from("pos_products")
    .select("*")
    .eq("organizer_id", organizerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (opts?.activeOnly !== false) {
    q = q.eq("is_active", true);
  }

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as ProductRow[];
  const eventId = opts?.eventId;
  const filtered =
    eventId == null || eventId === ""
      ? rows
      : rows.filter((r) => r.event_id == null || r.event_id === eventId);

  return filtered.map(mapProduct);
}

export type PosProductInput = {
  name: string;
  priceYen: number;
  category: PosCategoryId;
  imageUrl?: string | null;
  eventId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createPosProduct(
  supabase: DbClient,
  organizerId: string,
  input: PosProductInput
): Promise<PosProduct> {
  const { data, error } = await supabase
    .from("pos_products")
    .insert({
      organizer_id: organizerId,
      event_id: input.eventId ?? null,
      name: input.name.trim(),
      price_yen: Math.max(0, Math.round(input.priceYen)),
      category: input.category,
      image_url: input.imageUrl ?? null,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapProduct(data as ProductRow);
}

export async function updatePosProduct(
  supabase: DbClient,
  organizerId: string,
  productId: string,
  input: Partial<PosProductInput>
): Promise<PosProduct | null> {
  const patch: Record<string, unknown> = {};
  if (input.name != null) patch.name = input.name.trim();
  if (input.priceYen != null) patch.price_yen = Math.max(0, Math.round(input.priceYen));
  if (input.category != null) patch.category = input.category;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.eventId !== undefined) patch.event_id = input.eventId;
  if (input.sortOrder != null) patch.sort_order = input.sortOrder;
  if (input.isActive != null) patch.is_active = input.isActive;

  const { data, error } = await supabase
    .from("pos_products")
    .update(patch)
    .eq("id", productId)
    .eq("organizer_id", organizerId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data ? mapProduct(data as ProductRow) : null;
}

export async function deletePosProduct(
  supabase: DbClient,
  organizerId: string,
  productId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("pos_products")
    .update({ is_active: false })
    .eq("id", productId)
    .eq("organizer_id", organizerId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export type CheckoutLineInput = {
  productId: string;
  quantity: number;
};

export async function createCashSale(
  supabase: DbClient,
  organizerId: string,
  opts: {
    eventId: string | null;
    lines: CheckoutLineInput[];
    cashReceivedYen: number;
  }
): Promise<PosSale> {
  const products = await listPosProducts(supabase, organizerId, {
    eventId: opts.eventId,
    activeOnly: true,
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: Array<{
    product_id: string;
    product_name: string;
    unit_price_yen: number;
    quantity: number;
    line_total_yen: number;
  }> = [];

  let totalYen = 0;
  for (const line of opts.lines) {
    const product = byId.get(line.productId);
    if (!product || line.quantity <= 0) {
      throw new Error("invalid_line");
    }
    const qty = Math.floor(line.quantity);
    const lineTotal = product.priceYen * qty;
    totalYen += lineTotal;
    items.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_yen: product.priceYen,
      quantity: qty,
      line_total_yen: lineTotal,
    });
  }

  if (items.length === 0 || totalYen <= 0) {
    throw new Error("empty_cart");
  }

  const cashReceived = Math.max(0, Math.round(opts.cashReceivedYen));
  if (cashReceived < totalYen) {
    throw new Error("insufficient_cash");
  }
  const change = cashReceived - totalYen;
  const now = new Date().toISOString();

  const { data: sale, error: saleErr } = await supabase
    .from("pos_sales")
    .insert({
      organizer_id: organizerId,
      event_id: opts.eventId,
      payment_method: "cash",
      status: "paid",
      total_yen: totalYen,
      cash_received_yen: cashReceived,
      cash_change_yen: change,
      platform_fee_yen: 0,
      organizer_net_yen: totalYen,
      paid_at: now,
    })
    .select("*")
    .single();

  if (saleErr) throw saleErr;

  const saleId = (sale as SaleRow).id;
  const { data: itemRows, error: itemErr } = await supabase
    .from("pos_sale_items")
    .insert(items.map((it) => ({ ...it, sale_id: saleId })))
    .select("*");

  if (itemErr) throw itemErr;

  return mapSale(
    sale as SaleRow,
    ((itemRows ?? []) as SaleItemRow[]).map(mapSaleItem)
  );
}

export async function createPendingOnlineSale(
  supabase: DbClient,
  organizerId: string,
  opts: {
    eventId: string | null;
    lines: CheckoutLineInput[];
  }
): Promise<{ sale: PosSale; platformFeeYen: number }> {
  const products = await listPosProducts(supabase, organizerId, {
    eventId: opts.eventId,
    activeOnly: true,
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: Array<{
    product_id: string;
    product_name: string;
    unit_price_yen: number;
    quantity: number;
    line_total_yen: number;
  }> = [];

  let totalYen = 0;
  for (const line of opts.lines) {
    const product = byId.get(line.productId);
    if (!product || line.quantity <= 0) {
      throw new Error("invalid_line");
    }
    const qty = Math.floor(line.quantity);
    const lineTotal = product.priceYen * qty;
    totalYen += lineTotal;
    items.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_yen: product.priceYen,
      quantity: qty,
      line_total_yen: lineTotal,
    });
  }

  if (items.length === 0 || totalYen <= 0) {
    throw new Error("empty_cart");
  }

  const platformFeeYen = calcPosPlatformFeeYen(totalYen);
  const organizerNetYen = calcPosOrganizerNetYen(totalYen, platformFeeYen);

  const { data: sale, error: saleErr } = await supabase
    .from("pos_sales")
    .insert({
      organizer_id: organizerId,
      event_id: opts.eventId,
      payment_method: "online",
      status: "pending",
      total_yen: totalYen,
      platform_fee_yen: platformFeeYen,
      organizer_net_yen: organizerNetYen,
    })
    .select("*")
    .single();

  if (saleErr) throw saleErr;

  const saleId = (sale as SaleRow).id;
  const { data: itemRows, error: itemErr } = await supabase
    .from("pos_sale_items")
    .insert(items.map((it) => ({ ...it, sale_id: saleId })))
    .select("*");

  if (itemErr) throw itemErr;

  return {
    sale: mapSale(
      sale as SaleRow,
      ((itemRows ?? []) as SaleItemRow[]).map(mapSaleItem)
    ),
    platformFeeYen,
  };
}

export async function attachStripeSessionToSale(
  supabase: DbClient,
  saleId: string,
  organizerId: string,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from("pos_sales")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", saleId)
    .eq("organizer_id", organizerId);
  if (error) throw error;
}

export async function markPosSalePaidBySession(
  supabase: DbClient,
  sessionId: string,
  paymentIntentId: string | null,
  amountYen: number
): Promise<void> {
  const { data: sale } = await supabase
    .from("pos_sales")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (!sale) return;
  if ((sale as SaleRow).status === "paid") return;

  const fee = (sale as SaleRow).platform_fee_yen ?? calcPosPlatformFeeYen(amountYen);
  const net = calcPosOrganizerNetYen(amountYen, fee);
  const now = new Date().toISOString();

  await supabase
    .from("pos_sales")
    .update({
      status: "paid",
      total_yen: amountYen,
      platform_fee_yen: fee,
      organizer_net_yen: net,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: now,
    })
    .eq("id", (sale as SaleRow).id);
}

export async function getPosSaleById(
  supabase: DbClient,
  organizerId: string,
  saleId: string
): Promise<PosSale | null> {
  const { data: sale, error } = await supabase
    .from("pos_sales")
    .select("*")
    .eq("id", saleId)
    .eq("organizer_id", organizerId)
    .maybeSingle();

  if (error) throw error;
  if (!sale) return null;

  const { data: items, error: itemErr } = await supabase
    .from("pos_sale_items")
    .select("*")
    .eq("sale_id", saleId);

  if (itemErr) throw itemErr;

  return mapSale(
    sale as SaleRow,
    ((items ?? []) as SaleItemRow[]).map(mapSaleItem)
  );
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getPosSalesSummary(
  supabase: DbClient,
  organizerId: string,
  opts?: { eventId?: string | null; sinceIso?: string }
): Promise<{ summary: PosSalesSummary; sales: PosSale[] }> {
  const since = opts?.sinceIso ?? startOfTodayIso();

  let q = supabase
    .from("pos_sales")
    .select("*")
    .eq("organizer_id", organizerId)
    .eq("status", "paid")
    .gte("paid_at", since)
    .order("paid_at", { ascending: false })
    .limit(100);

  if (opts?.eventId) {
    q = q.eq("event_id", opts.eventId);
  }

  const { data: saleRows, error } = await q;
  if (error) throw error;

  const salesRaw = (saleRows ?? []) as SaleRow[];
  const saleIds = salesRaw.map((s) => s.id);

  let itemRows: SaleItemRow[] = [];
  if (saleIds.length > 0) {
    const { data: items, error: itemErr } = await supabase
      .from("pos_sale_items")
      .select("*")
      .in("sale_id", saleIds);
    if (itemErr) throw itemErr;
    itemRows = (items ?? []) as SaleItemRow[];
  }

  const itemsBySale = new Map<string, PosSaleItem[]>();
  for (const row of itemRows) {
    const list = itemsBySale.get(row.sale_id) ?? [];
    list.push(mapSaleItem(row));
    itemsBySale.set(row.sale_id, list);
  }

  const sales = salesRaw.map((s) => mapSale(s, itemsBySale.get(s.id)));

  let totalYen = 0;
  let cashYen = 0;
  let onlineYen = 0;
  let platformFeeYen = 0;
  const productMap = new Map<
    string,
    { productId: string | null; productName: string; quantity: number; totalYen: number }
  >();

  for (const sale of sales) {
    totalYen += sale.totalYen;
    platformFeeYen += sale.platformFeeYen;
    if (sale.paymentMethod === "cash") cashYen += sale.totalYen;
    else onlineYen += sale.totalYen;

    for (const item of sale.items ?? []) {
      const key = item.productId ?? item.productName;
      const prev = productMap.get(key) ?? {
        productId: item.productId,
        productName: item.productName,
        quantity: 0,
        totalYen: 0,
      };
      prev.quantity += item.quantity;
      prev.totalYen += item.lineTotalYen;
      productMap.set(key, prev);
    }
  }

  return {
    summary: {
      totalYen,
      cashYen,
      onlineYen,
      saleCount: sales.length,
      platformFeeYen,
      byProduct: Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity),
    },
    sales,
  };
}
