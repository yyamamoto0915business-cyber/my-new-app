/** 当日運営ダッシュボード用の型 */

export type DayOpsSalesMode = "stripe" | "offline" | "free";

export type DayOpsAttendance = {
  checkedIn: number;
  notCheckedIn: number;
  cancelled: number;
};

export type DayOpsSalesSummary = {
  soldTickets: number;
  capacity: number | null;
  orderCount: number;
  /** 返金前の販売総額（paid + refunded） */
  grossSalesYen: number;
  checkedIn: number;
  /** 有効チケット保持者（paid） */
  validHolders: number;
};

export type DayOpsFlow = {
  purchased: number;
  attended: number;
  receptionComplete: number;
};

export type DayOpsTicketSalesSummary = {
  updatedAt: string;
  salesMode: DayOpsSalesMode;
  attendance: DayOpsAttendance;
  sales: DayOpsSalesSummary | null;
  flow: DayOpsFlow;
};

export type DayOpsStaffStatus = "on_duty" | "break" | "absent" | "busy";

export type DayOpsStaffMember = {
  id: string;
  name: string;
  role: string;
  status: DayOpsStaffStatus;
  avatarUrl?: string | null;
  updatedAt: string;
};
