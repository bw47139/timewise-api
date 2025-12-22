// src/modules/organization/organization.types.ts

export interface OrganizationUpdateData {
  name?: string;
  payPeriodType?: string;
  weekStartDay?: number | null;
  biWeeklyAnchorDate?: Date | null;

  autoLunchEnabled?: boolean;
  autoLunchMinutes?: number;
  autoLunchMinimumShift?: number;
  autoLunchDeductOnce?: boolean;
  autoLunchIgnoreIfBreak?: boolean;
}
