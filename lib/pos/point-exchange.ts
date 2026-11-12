/**
 * レジでイベントポイントを商品と交換するときの計算。画面（カート）とサーバー（会計）で同じものを使う。
 *
 * - 交換ptが決まっている商品（pointPrice）だけが対象
 * - カートの上から順に、残りのポイントで交換できる個数だけ交換する（1個ずつ）
 * - 交換した分は ¥0、残りの個数はふつうの値段
 */
export type PointExchangeInputLine = {
  productId: string;
  quantity: number;
  unitPriceYen: number;
  pointPrice: number | null | undefined;
};

export type PointExchangeLine = {
  productId: string;
  /** ポイントで交換した個数 */
  units: number;
  /** この行で使ったポイント */
  points: number;
  /** この行で払うお金（交換しなかった分） */
  payYen: number;
};

export type PointExchangePlan = {
  lines: PointExchangeLine[];
  pointsUsed: number;
  /** ポイントで交換したあとに払うお金の合計 */
  payYen: number;
  /** 交換ptが決まっている商品がカートにあるか */
  hasExchangeable: boolean;
};

export function planPointExchange(input: PointExchangeInputLine[], balance: number): PointExchangePlan {
  let remaining = Math.max(0, Math.floor(balance));
  let pointsUsed = 0;
  let payYen = 0;
  let hasExchangeable = false;
  const lines = input.map((line) => {
    const qty = Math.max(0, Math.floor(line.quantity));
    const price = line.pointPrice != null && line.pointPrice > 0 ? Math.floor(line.pointPrice) : null;
    let units = 0;
    if (price) {
      hasExchangeable = true;
      units = Math.min(qty, Math.floor(remaining / price));
    }
    const points = price ? units * price : 0;
    remaining -= points;
    pointsUsed += points;
    const linePay = line.unitPriceYen * (qty - units);
    payYen += linePay;
    return { productId: line.productId, units, points, payYen: linePay };
  });
  return { lines, pointsUsed, payYen, hasExchangeable };
}
