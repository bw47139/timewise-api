import dayjs from "dayjs";

type Punch = {
  type: "IN" | "OUT";
  timestamp: Date;
};

type PayrollOptions = {
  hourlyRate: number;
  overtimeMultiplier?: number; // default 1.5
};

type DayResult = {
  date: string;
  hours: number;
};

type PayrollResult = {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;

  regularPay: number;
  overtimePay: number;
  grossPay: number;

  daily: DayResult[];
};

/**
 * ---------------------------------------------------------
 * PAYROLL ENGINE v1
 *
 * Rules:
 * - Weekly overtime after 40 hours
 * - No daily overtime yet
 * - IN/OUT punch pairing
 * ---------------------------------------------------------
 */
export function calculatePayroll(
  punches: Punch[],
  options: PayrollOptions
): PayrollResult {
  const hourlyRate = options.hourlyRate;
  const overtimeMultiplier = options.overtimeMultiplier ?? 1.5;

  // --------------------------------------------------
  // GROUP PUNCHES BY DAY
  // --------------------------------------------------
  const dayMap = new Map<string, Punch[]>();

  for (const p of punches) {
    const day = dayjs(p.timestamp).format("YYYY-MM-DD");
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(p);
  }

  let weeklyTotal = 0;
  const daily: DayResult[] = [];

  // --------------------------------------------------
  // CALCULATE DAILY HOURS
  // --------------------------------------------------
  for (const [date, list] of dayMap.entries()) {
    list.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    let dayHours = 0;

    for (let i = 0; i < list.length; i += 2) {
      const inPunch = list[i];
      const outPunch = list[i + 1];

      if (!inPunch || !outPunch) continue;
      if (inPunch.type !== "IN" || outPunch.type !== "OUT") continue;

      const diffHours =
        (outPunch.timestamp.getTime() -
          inPunch.timestamp.getTime()) /
        1000 /
        60 /
        60;

      if (diffHours > 0) {
        dayHours += diffHours;
      }
    }

    weeklyTotal += dayHours;

    daily.push({
      date,
      hours: Number(dayHours.toFixed(2)),
    });
  }

  weeklyTotal = Number(weeklyTotal.toFixed(2));

  // --------------------------------------------------
  // WEEKLY OVERTIME SPLIT
  // --------------------------------------------------
  const regularHours = Math.min(40, weeklyTotal);
  const overtimeHours = Math.max(0, weeklyTotal - 40);

  // --------------------------------------------------
  // PAY CALCULATIONS
  // --------------------------------------------------
  const regularPay = regularHours * hourlyRate;
  const overtimePay =
    overtimeHours * hourlyRate * overtimeMultiplier;

  const grossPay = regularPay + overtimePay;

  // --------------------------------------------------
  // FINAL RESULT
  // --------------------------------------------------
  return {
    regularHours: Number(regularHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    totalHours: weeklyTotal,

    regularPay: Number(regularPay.toFixed(2)),
    overtimePay: Number(overtimePay.toFixed(2)),
    grossPay: Number(grossPay.toFixed(2)),

    daily,
  };
}
