"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAutoLunch = applyAutoLunch;
const luxon_1 = require("luxon");
function applyAutoLunch(punches, settings) {
    if (!settings.autoLunchEnabled)
        return 0;
    if (punches.length < 2)
        return 0;
    const firstIn = punches.find((p) => p.type === "IN");
    const lastOut = [...punches].reverse().find((p) => p.type === "OUT");
    if (!firstIn || !lastOut)
        return 0;
    const start = luxon_1.DateTime.fromJSDate(firstIn.timestamp);
    const end = luxon_1.DateTime.fromJSDate(lastOut.timestamp);
    const shiftHours = end.diff(start, "hours").hours;
    if (shiftHours < settings.autoLunchMinimumShift)
        return 0;
    return settings.autoLunchMinutes;
}
