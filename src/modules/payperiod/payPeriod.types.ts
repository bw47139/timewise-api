export interface PayPeriodRange {
  startDate: Date;
  endDate: Date;
}

export interface OrganizationLike {
  payPeriodType: string;
  weekStartDay?: number | null;
  biWeeklyAnchorDate?: Date | null;
}
