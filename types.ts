

export interface Kpi {
  kpiNo?: string;
  title: string;
  value: string;
  subValue?: string;
  subValuePosition?: 'inline' | 'bottom';
  target?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  comparison?: {
    value: string;
    percentage: string;
    period: 'month' | 'year';
    previousValue?: string;
  };
}

export interface ChartDataPoint {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

export interface TableRow {
  kpiNo: string;
  kpi: {
    title: string;
    measurement: string;
  };
  target: string;
  score: string;
  result: string;
  monthlyData: { [key: string]: string };
  description: string;
  objective: string;
  measurementMethod: string;
  responsible: string;
  improvementPlan: string;
}

export interface ConsumableRow {
  date: string;
  material: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
  totalPrice: string;
  costCenter: string;
  department: string;
}

export interface OtRow {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  grade: string;
  status: string;
  monthlyOT: number[];
  totalOT: number;
  otRate: number;
  monthlyOTPay: number[];
  totalOTPay: number;
  year: number;
}

export interface OtAverageRow {
  department: string;
  employeeCount: number;
  totalOtHours: number;
  avgOtHoursPerMonth: number;
  avgOtHoursPerWeek: number;
}

export interface LeaveRow {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  grade: string;
  status: string;
  monthlyLeave: number[];
  leaveWithoutVacation: number;
  totalLeaveWithVacation: number;
  vacationCarriedOver: number;
  vacationEntitlement: number;
  totalVacation: number;
  vacationUsed: number;
  vacationAccrued: number;
  sickLeave: number;
  personalLeave: number;
  birthdayLeave: number;
  otherLeave: number;
  totalLeave: number;
}

export interface AccidentRow {
  id: string;
  incidentDate: string;
  incidentTime: string;
  severity: string;
  occurrence: string;
  department: string;
  employeeId: string;
  employeeName: string;
  position: string;
  details: string;
  cause: string;
  prevention: string;
  damageValue: number;
  insuranceClaim: string;
  actionTaken: string;
  penalty: string;
  remarks: string;
  accidentLocation: string;
}

export interface WorkloadDetailRow {
    description: string;
    isSubRow: boolean;
    unit: string;
    values: (number | null)[];
    average: number | null;
    min: number | null;
    max: number | null;
}

export interface WorkloadProductSection {
    product: string;
    isSubProduct?: boolean;
    rows: WorkloadDetailRow[];
}

export interface ManpowerRow {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  grade: string;
  status: string;
  manpower: string;
  current: string;
  hireDate?: string;
  terminationDate?: string;
}

export interface DepartmentComparison {
    department: string;
    manpower: number;
    current: number;
    needed: number;
    neededPositions?: { position: string; count: number }[];
}

export interface WarningLetterRow {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  reason: string;
  warningId: string;
  damageValue: number;
  type: string;
  hrSentDate: string;
  hrInvestigationDate: string;
  hrWarningReceivedDate: string;
  documentStatus: string;
}

export interface TurnoverRow {
  id: string; // NO.
  employeeId: string; // EMP.
  name: string; // NAME-SURENAME
  position: string; // POSITION
  status: string; // 'สถานะ' -> ทำงาน/ลาออก
  costCenter: string; // COST CENTER
  department: string; // DEPT.
  grade: string; // Grade
  hireDateBuddhist: string; // 'วันเริ่มงาน (พ.ศ.)'
  hireDate: string; // 'วันเริ่มงาน (ค.ศ.)'
  tenureYears: number; // 'อายุงาน (ปี)'
  tenureMonths: number; // 'อายุงาน (เดือน)'
  tenureDays: number; // 'อายุงาน (วัน)'
  probationPassDate: string; // 'วันที่ผ่านทดลองงาน'
  nickname: string; // 'ชื่อเล่น'
  now: string; // '=Now'
  dob: string; // 'วัน-เดือน-ปีเกิด'
  age: number; // 'อายุ'
  religion: string; // 'ศาสนา'
  mobile: string; // 'โทรศัพท์มือถือ'
  hometown: string; // 'ภูมิลำเนา'
  education: string; // 'วุฒิการศึกษา'
  employmentType: string; // 'STATUS' -> M
  terminationDate: string; // 'ทำงานวันสุดท้าย'
  effectiveDate: string; // 'วันที่มีผล'
  reasonForLeaving: string; // 'สาเหตุการลาออก'
}

export interface TrainingRow {
  id: string;
  courseName: string;
  employeeId: string;
  employeeName: string;
  department: string;
  trainingDate: string;
  durationHours: number;
  cost: number;
  status: 'Completed' | 'Scheduled' | 'Cancelled';
  trainer: string;
  location: string;
}

export interface PurchaseRequestRow {
  id: string; // เลขที่ PR
  date: string; // วันที่เปิด PR
  requester: string;
  department: string; // ส่วนงาน
  itemDescription: string; // รายการสั่งซื้อ
  quantity: number; // จำนวน
  unit: string; // หน่วย
  unitPrice: number; // ราคา/หน่วย
  totalPrice: number; // รวมจำนวนเงิน
  supplier: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Ordered' | 'Completed'; // สถานะ
  objective: string; // วัตถุประสงค์
  goodsReceivedDate: string; // วันที่รับสินค้า
  leadTimeDays: number; // ระยะเวลาการสั่งซื้อ
}