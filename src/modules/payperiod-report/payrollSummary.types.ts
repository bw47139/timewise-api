export interface EmployeePayrollBreakdown {
  employeeId: number;
  name: string;

  hours: {
    regular: number;
    overtime: number;
    doubletime: number;
  };

  pay: {
    regular: number;
    overtime: number;
    doubletime: number;
    gross: number;
  };
}

export interface PayrollSummaryResponse {
  payPeriod: {
    type: string;
    start: string;
    end: string;
  };

  employees: EmployeePayrollBreakdown[];

  totals: {
    totalEmployees: number;
    totalGrossPay: number;
  };
}
