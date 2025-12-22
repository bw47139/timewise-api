import { DateTime } from "luxon";

export interface AutoLunchSettings {
  autoLunchEnabled: boolean;
  autoLunchMinutes: number;
  autoLunchMinimumShift: number;
  autoLunchDeductOnce: boolean;
  autoLunchIgnoreIfBreak: boolean;
}

export function applyAutoLunch(punches: any[], settings: AutoLunchSettings) {
  if (!settings.autoLunchEnabled) return 0;
  if (punches.length < 2) return 0;

  const firstIn = punches.find((p) => p.type === "IN");
  const lastOut = [...punches].reverse().find((p) => p.type === "OUT");

  if (!firstIn || !lastOut) return 0;

  const start = DateTime.fromJSDate(firstIn.timestamp);
  const end = DateTime.fromJSDate(lastOut.timestamp);

  const shiftHours = end.diff(start, "hours").hours;

  if (shiftHours < settings.autoLunchMinimumShift) return 0;

  return settings.autoLunchMinutes;
}
