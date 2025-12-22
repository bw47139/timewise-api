export interface TimecardPunch {
  id: number;
  type: "IN" | "OUT";
  timestamp: Date;
}

export interface TimecardDay {
  date: string;
  punches: TimecardPunch[];
  totalWorkMinutes: number;
  autoLunchDeducted: number;
}

export interface TimecardResult {
  employeeId: number;
  startDate: string;
  endDate: string;
  days: TimecardDay[];
  totalMinutes: number;
}
