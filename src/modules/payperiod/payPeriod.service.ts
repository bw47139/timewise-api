import { PayPeriodRange, OrganizationLike } from "./payPeriod.types";

function weekly(org: OrganizationLike, ref: Date): PayPeriodRange {
  const start = new Date(ref);
  const target = org.weekStartDay ?? 0;
  const diff = (ref.getDay() - target + 7) % 7;

  start.setDate(ref.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { startDate: start, endDate: end };
}

function biweekly(org: OrganizationLike, ref: Date): PayPeriodRange {
  if (!org.biWeeklyAnchorDate) {
    throw new Error("biWeeklyAnchorDate is required for BIWEEKLY.");
  }

  const anchor = new Date(org.biWeeklyAnchorDate);
  const start = new Date(anchor);

  while (start <= ref) {
    start.setDate(start.getDate() + 14);
  }

  const end = new Date(start);
  end.setDate(start.getDate() + 14);

  return { startDate: start, endDate: end };
}

function semiMonthly(_org: OrganizationLike, ref: Date): PayPeriodRange {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const day = ref.getDate();

  if (day <= 15) {
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month, 16),
    };
  }

  return {
    startDate: new Date(year, month, 16),
    endDate: new Date(year, month + 1, 1),
  };
}

function monthly(_org: OrganizationLike, ref: Date): PayPeriodRange {
  const year = ref.getFullYear();
  const month = ref.getMonth();

  return {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 1),
  };
}

export function computePayPeriod(
  org: OrganizationLike,
  refDate: Date
): PayPeriodRange {
  switch (org.payPeriodType) {
    case "WEEKLY":
      return weekly(org, refDate);
    case "BIWEEKLY":
      return biweekly(org, refDate);
    case "SEMIMONTHLY":
      return semiMonthly(org, refDate);
    case "MONTHLY":
      return monthly(org, refDate);
    default:
      throw new Error(`Unsupported pay period type: ${org.payPeriodType}`);
  }
}
