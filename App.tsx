
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiReport from './components/reports/KpiReport';
import ConsumablesReport from './components/reports/ConsumablesReport';
import OTReport from './components/reports/OTReport';
import LeaveReport from './components/reports/LeaveReport';
import AccidentReport from './components/reports/AccidentReport';
import WorkloadReport from './components/reports/WorkloadReport';
import ManpowerReport from './components/reports/ManpowerReport';
import WarningLetterReport from './components/reports/WarningLetterReport';
import TurnoverReport from './components/reports/TurnoverReport';
import PurchaseRequestReport from './components/reports/PurchaseRequestReport';
import PlaceholderPage from './components/PlaceholderPage';
import LoadingSpinner from './components/LoadingSpinner';

// Import types
import { Kpi, TableRow, ConsumableRow, OtRow, LeaveRow, AccidentRow, WorkloadProductSection, ChartDataPoint, ManpowerRow, DepartmentComparison, WarningLetterRow, TurnoverRow, TrainingRow, OtAverageRow, PurchaseRequestRow } from './types';
import { useTranslation } from './context/LanguageProvider';

// Import constants and services
import { DB_STORAGE_KEY, getKpiIcon, modifySpecificKpiScore, parseValue } from './constants';
import { saveToFirestore, getFromFirestore, isFirebaseConnected, testFirebaseConnection, clearFirestoreCollection } from './services/firebase';

declare const Swal: any;

// Define the shape of our application's data
interface AppData {
    kpiReport: { kpis: Kpi[]; tableRows: TableRow[]; };
    consumablesReport: { 
        tableData: ConsumableRow[]; 
        kpis: Kpi[]; 
        chartData: ChartDataPoint[]; 
        topItems: { name: string; frequency: number; totalCost: number; material: string; }[]; 
    };
    otReport: { tableData: OtRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; otAveragesByDept: OtAverageRow[]; };
    leaveReport: { tableData: LeaveRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; };
    accidentReport: { tableData: AccidentRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; };
    accidentWh1Report: { tableData: AccidentRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; };
    workloadReport: { data: WorkloadProductSection[]; };
    manpowerReport: { 
        tableData: ManpowerRow[]; 
        kpis: Kpi[]; 
        statusChartData: ChartDataPoint[];
        deptChartData: ChartDataPoint[];
        departmentComparisonData: DepartmentComparison[];
    };
    warningLetterReport: { 
        tableData: WarningLetterRow[];
        kpis: Kpi[];
        byDeptChartData: ChartDataPoint[];
        byTypeChartData: ChartDataPoint[];
        damageByDeptChartData: ChartDataPoint[];
    };
    turnoverReport: {
        tableData: TurnoverRow[];
        kpis: Kpi[];
        monthlyChartData: ChartDataPoint[];
        reasonChartData: ChartDataPoint[];
        deptChartData: ChartDataPoint[];
    };
    trainingReport: {
        tableData: TrainingRow[];
        kpis: Kpi[];
        chartData: ChartDataPoint[];
    };
    purchaseRequestReport: {
        tableData: PurchaseRequestRow[];
        kpis: Kpi[];
        byDeptChartData: ChartDataPoint[];
        byStatusChartData: ChartDataPoint[];
        monthlyChartData: ChartDataPoint[];
    };
    [key: string]: any; // Index signature
}

// Initial empty state for the application data
const initialAppData: AppData = {
    kpiReport: { kpis: [], tableRows: [] },
    consumablesReport: { 
        tableData: [], 
        kpis: [], 
        chartData: [], 
        topItems: [], 
    },
    otReport: { tableData: [], kpis: [], chartData: [], otAveragesByDept: [] },
    leaveReport: { tableData: [], kpis: [], chartData: [] },
    accidentReport: { tableData: [], kpis: [], chartData: [] },
    accidentWh1Report: { tableData: [], kpis: [], chartData: [] },
    workloadReport: { data: [] },
    manpowerReport: { tableData: [], kpis: [], statusChartData: [], deptChartData: [], departmentComparisonData: [] },
    warningLetterReport: { tableData: [], kpis: [], byDeptChartData: [], byTypeChartData: [], damageByDeptChartData: [] },
    turnoverReport: { tableData: [], kpis: [], monthlyChartData: [], reasonChartData: [], deptChartData: [] },
    trainingReport: { tableData: [], kpis: [], chartData: [] },
    purchaseRequestReport: { tableData: [], kpis: [], byDeptChartData: [], byStatusChartData: [], monthlyChartData: [] },
};

const App: React.FC = () => {
    const [activePage, setActivePage] = useState('kpiReport');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [appData, setAppData] = useState<AppData>(initialAppData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const [firestoreDocId, setFirestoreDocId] = useState<string | null>(null);

    // Theme effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Initial data load effect
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await testFirebaseConnection();
            if (isFirebaseConnected()) {
                await handleLoadFromFirestore();
            } else {
                try {
                    const localDataString = localStorage.getItem(DB_STORAGE_KEY);
                    if (localDataString) {
                        const localData = JSON.parse(localDataString);
                        // Merge local data with initial state to ensure all keys exist
                        const mergedData: AppData = {
                            ...initialAppData,
                            kpiReport: { ...initialAppData.kpiReport, ...(localData.kpiReport || {}) },
                            consumablesReport: { ...initialAppData.consumablesReport, ...(localData.consumablesReport || {}) },
                            otReport: { ...initialAppData.otReport, ...(localData.otReport || {}) },
                            leaveReport: { ...initialAppData.leaveReport, ...(localData.leaveReport || {}) },
                            accidentReport: { ...initialAppData.accidentReport, ...(localData.accidentReport || {}) },
                            accidentWh1Report: { ...initialAppData.accidentWh1Report, ...(localData.accidentWh1Report || {}) },
                            workloadReport: { ...initialAppData.workloadReport, ...(localData.workloadReport || {}) },
                            manpowerReport: { ...initialAppData.manpowerReport, ...(localData.manpowerReport || {}) },
                            warningLetterReport: { ...initialAppData.warningLetterReport, ...(localData.warningLetterReport || {}) },
                            turnoverReport: { ...initialAppData.turnoverReport, ...(localData.turnoverReport || {}) },
                            trainingReport: { ...initialAppData.trainingReport, ...(localData.trainingReport || {}) },
                            purchaseRequestReport: { ...initialAppData.purchaseRequestReport, ...(localData.purchaseRequestReport || {}) },
                        };
                        setAppData(mergedData);
                    }
                } catch (e) {
                    console.error("Failed to load data from localStorage", e);
                }
            }
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const saveData = useCallback((data: AppData) => {
        setAppData(data);
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
        if (isFirebaseConnected()) {
            saveToFirestore('reports', data, firestoreDocId).then(id => {
                if (id && !firestoreDocId) setFirestoreDocId(id);
            });
        }
    }, [firestoreDocId]);

    const processFile = async (file: File): Promise<Partial<AppData>> => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    let processedData: Partial<AppData> = {};
                    
                    const parseExcelDate = (excelDate: any): string => {
                        if (!excelDate || String(excelDate).trim() === '' || excelDate === '-') return '';
                        if (typeof excelDate === 'number' && excelDate > 0) {
                            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                            return jsDate.toLocaleDateString('en-GB'); // dd/mm/yyyy
                        } else if (excelDate instanceof Date) {
                            return excelDate.toLocaleDateString('en-GB');
                        }
                        return String(excelDate);
                    };

                    switch (activePage) {
                        case 'kpiReport': {
                            const sheetName = workbook.SheetNames[0];
                            if (!sheetName) {
                                throw new Error("No sheets found in the Excel file.");
                            }
                            const worksheet = workbook.Sheets[sheetName];
                            const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                            const rows = json.slice(1); // Skip header row
                            if (rows.length === 0) {
                                throw new Error("The KPI sheet has no data rows.");
                            }

                            const colors = ['text-brand-primary', 'text-brand-secondary', 'text-brand-success', 'text-brand-danger', 'text-brand-warning'];
                            const monthCols = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                            const tableRows: TableRow[] = rows.map((row): TableRow | null => {
                                if (!row || !row[1]) return null;
                                
                                const monthlyData: { [key: string]: string } = {};
                                monthCols.forEach((month, index) => {
                                    monthlyData[month] = String(row[4 + index] || '');
                                });

                                return {
                                    kpiNo: String(row[0] || ''),
                                    kpi: { title: String(row[1] || ''), measurement: String(row[3] || '') },
                                    target: String(row[2] || ''),
                                    score: String(row[16] || 'N/A'),
                                    result: String(row[17] || 'N/A'),
                                    monthlyData,
                                    description: String(row[18] || ''),
                                    objective: String(row[19] || ''),
                                    measurementMethod: String(row[20] || ''),
                                    responsible: String(row[21] || ''),
                                    improvementPlan: String(row[22] || ''),
                                };
                            }).filter((r): r is TableRow => r !== null);

                            const kpis: Kpi[] = tableRows.map((row, index) => ({
                                title: row.kpi.title,
                                value: modifySpecificKpiScore(row.kpi.title, row.score),
                                trend: row.result,
                                trendDirection: String(row.result).toUpperCase() === 'PASS' ? 'up' : 'down',
                                icon: getKpiIcon(row.kpi.title),
                                color: colors[index % colors.length],
                            }));

                            processedData.kpiReport = { kpis, tableRows };
                            break;
                        }
                        case 'consumablesReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                            if (sheetData.length < 2) throw new Error("Consumables sheet is empty or has no data rows.");
                            
                            const rows = sheetData.slice(1);

                            const tableData: ConsumableRow[] = rows.map(rowArray => {
                                if (!rowArray || rowArray.length === 0 || !rowArray[1]) return null;
                                return {
                                    date: parseExcelDate(rowArray[0]), material: String(rowArray[1] || ''), description: String(rowArray[2] || ''),
                                    quantity: String(rowArray[3] || '0'), unit: String(rowArray[4] || ''), price: String(rowArray[5] || '0'),
                                    totalPrice: String(rowArray[6] || '0'), costCenter: String(rowArray[7] || ''), department: String(rowArray[8] || ''),
                                };
                            }).filter((r): r is ConsumableRow => r !== null && r.material !== '');

                            const dataFor2025 = tableData.filter(r => r.date.endsWith('/2025'));

                            const topItems = Object.values(dataFor2025.reduce((acc, row) => {
                                const key = row.material || 'Unknown';
                                if (!acc[key]) acc[key] = { name: row.description || key, frequency: 0, totalCost: 0, material: key };
                                acc[key].frequency++;
                                acc[key].totalCost += parseValue(row.totalPrice) || 0;
                                return acc;
                            }, {} as { [key: string]: { name: string; frequency: number; totalCost: number; material: string } })).sort((a, b) => b.totalCost - a.totalCost).slice(0, 10);
                            
                            const monthlyTotals = Array(12).fill(0);
                            const today = new Date();
                            const currentYear = today.getFullYear();
                            const lastYear = currentYear - 1;
                            
                            const thisYearData = tableData.filter(r => r.date.endsWith(`/${currentYear}`));
                            const lastYearData = tableData.filter(r => r.date.endsWith(`/${lastYear}`));

                            thisYearData.forEach(row => {
                                const dateParts = row.date.split('/');
                                if (dateParts.length !== 3) return;
                                const month = parseInt(dateParts[1], 10) - 1;
                                const cost = parseValue(row.totalPrice) || 0;

                                if (month >= 0 && month < 12) monthlyTotals[month] += cost;
                            });
                            
                            const chartData = monthlyTotals.map((total, i) => ({ name: new Date(0, i).toLocaleString('en', { month: 'short' }), value: total }));
                            
                            const thisYearTotalCost = thisYearData.reduce((acc, row) => acc + (parseValue(row.totalPrice) || 0), 0);
                            const lastYearTotalCost = lastYearData.reduce((acc, row) => acc + (parseValue(row.totalPrice) || 0), 0);
                            const costDiff = thisYearTotalCost - lastYearTotalCost;
                            const costPctChange = lastYearTotalCost !== 0 ? (costDiff / lastYearTotalCost) * 100 : (thisYearTotalCost > 0 ? 100 : 0);

                            const thisYearTransactions = thisYearData.length;
                            const lastYearTransactions = lastYearData.length;
                            const transDiff = thisYearTransactions - lastYearTransactions;
                            const transPctChange = lastYearTransactions !== 0 ? (transDiff / lastYearTransactions) * 100 : (thisYearTransactions > 0 ? 100 : 0);

                            const thisYearUniqueItems = new Set(thisYearData.map(row => row.material)).size;
                            const lastYearUniqueItems = new Set(lastYearData.map(row => row.material)).size;
                            const itemsDiff = thisYearUniqueItems - lastYearUniqueItems;
                            const itemsPctChange = lastYearUniqueItems !== 0 ? (itemsDiff / lastYearUniqueItems) * 100 : (thisYearUniqueItems > 0 ? 100 : 0);

                            const thisYearUniqueDepts = new Set(thisYearData.map(row => row.department)).size;

                            const kpis: Kpi[] = [
                                {
                                    title: 'kpiTotalCost',
                                    value: `฿${thisYearTotalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                                    icon: 'CurrencyDollarIcon', color: 'text-brand-success',
                                    trendDirection: costDiff > 0 ? 'down' : 'up',
                                    comparison: {
                                        value: `฿${costDiff.toLocaleString('th-TH', { signDisplay: 'always', minimumFractionDigits: 2 })}`,
                                        percentage: `${costPctChange.toFixed(1)}%`,
                                        period: 'year',
                                        previousValue: `฿${lastYearTotalCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    }
                                },
                                {
                                    title: 'kpiTransactions',
                                    value: thisYearTransactions.toLocaleString(),
                                    icon: 'DocumentTextIcon', color: 'text-brand-secondary',
                                    trendDirection: transDiff > 0 ? 'down' : 'up',
                                    comparison: {
                                        value: transDiff.toLocaleString('en-US', { signDisplay: 'always' }),
                                        percentage: `${transPctChange.toFixed(1)}%`,
                                        period: 'year'
                                    }
                                },
                                {
                                    title: 'kpiTotalItems',
                                    value: thisYearUniqueItems.toLocaleString(),
                                    icon: 'ArchiveBoxIcon', color: 'text-brand-primary',
                                    trendDirection: itemsDiff > 0 ? 'down' : 'up',
                                    comparison: {
                                        value: itemsDiff.toLocaleString('en-US', { signDisplay: 'always' }),
                                        percentage: `${itemsPctChange.toFixed(1)}%`,
                                        period: 'year'
                                    }
                                },
                                {
                                    title: 'kpiDepartments',
                                    value: thisYearUniqueDepts.toLocaleString(),
                                    icon: 'BuildingOfficeIcon', color: 'text-brand-warning',
                                    trendDirection: 'neutral',
                                },
                            ];
                            
                            processedData.consumablesReport = { tableData, kpis, chartData, topItems };
                            break;
                        }
                        case 'otReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                            if (sheetData.length < 2) throw new Error("OT Report sheet is empty.");

                            const tableData: OtRow[] = sheetData.slice(1).map(row => {
                                if (!row || row.length < 34) return null;
                                const monthlyOT = Array.from({ length: 12 }, (_, i) => parseValue(row[7 + i]) || 0);
                                const monthlyOTPay = Array.from({ length: 12 }, (_, i) => parseValue(row[21 + i]) || 0);
                                return {
                                    id: String(row[0] || ''),
                                    employeeId: String(row[1] || ''),
                                    name: String(row[2] || ''),
                                    position: String(row[3] || ''),
                                    department: String(row[4] || ''),
                                    grade: String(row[5] || ''),
                                    status: String(row[6] || ''),
                                    monthlyOT,
                                    totalOT: parseValue(row[19]) || 0,
                                    otRate: parseValue(row[20]) || 0,
                                    monthlyOTPay,
                                    totalOTPay: parseValue(row[33]) || 0,
                                    year: parseValue(row[34]) || new Date().getFullYear(),
                                };
                            }).filter((r): r is OtRow => r !== null && r.employeeId !== '');

                            if (tableData.length === 0) {
                                processedData.otReport = { tableData: [], kpis: [], chartData: [], otAveragesByDept: [] };
                                break;
                            }

                            const allYears = tableData.map(row => row.year).filter(y => y > 0);
                            const targetYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();

                            const thisYearData = tableData.filter(row => row.year === targetYear);
                            
                            const totalOTAllThisYear = thisYearData.reduce((sum, row) => sum + row.totalOT, 0);
                            const totalOTPayAllThisYear = thisYearData.reduce((sum, row) => sum + row.totalOTPay, 0);
                            const totalEmployeesThisYear = thisYearData.length;

                            const totalOTAllLastYear_override = 57776.75;
                            const totalOTPayAllLastYear_override = 5230099.63;
                            const totalEmployeesLastYear_override = 105;

                            const createComparison = (current: number, previous: number, isCurrency: boolean) => {
                                if (previous === 0) return undefined;
                                const diff = current - previous;
                                const percentage = (diff / previous) * 100;
                            
                                const formatValue = (val: number, decimals: number) => {
                                    return val.toLocaleString('th-TH', {
                                        minimumFractionDigits: decimals,
                                        maximumFractionDigits: decimals,
                                    });
                                };
                            
                                const formatPreviousValue = (val: number) => {
                                    if (isCurrency) return `฿${formatValue(val, 2)}`;
                                    if (Number.isInteger(val)) return formatValue(val, 0);
                                    return formatValue(val, 2);
                                };
                            
                                const formatDiff = (val: number) => {
                                    const sign = val >= 0 ? '+' : '';
                                    if (isCurrency) return `${sign}฿${formatValue(val, 2)}`;
                                    if (Number.isInteger(current) && Number.isInteger(previous)) {
                                        return `${sign}${formatValue(Math.round(val), 0)}`;
                                    }
                                    return `${sign}${formatValue(val, 2)}`;
                                };
                            
                                return {
                                    value: formatDiff(diff),
                                    percentage: `${percentage.toFixed(1)}%`,
                                    period: 'year' as const,
                                    previousValue: formatPreviousValue(previous),
                                };
                            };

                            const hoursComparison = createComparison(totalOTAllThisYear, totalOTAllLastYear_override, false);
                            const payComparison = createComparison(totalOTPayAllThisYear, totalOTPayAllLastYear_override, true);
                            const employeesComparison = createComparison(totalEmployeesThisYear, totalEmployeesLastYear_override, false);

                            const isDecreaseGood = (comp: ReturnType<typeof createComparison>) => {
                                if (!comp) return 'neutral';
                                return comp.percentage.startsWith('-') ? 'up' : 'down';
                            };
                            
                            const monthlyHourTotals = Array(12).fill(0);
                            const monthlyPayTotals = Array(12).fill(0);
                            const departmentTotals: { [key: string]: number } = {};

                            thisYearData.forEach(row => {
                                row.monthlyOT.forEach((ot, index) => { monthlyHourTotals[index] += ot; });
                                row.monthlyOTPay.forEach((pay, index) => { monthlyPayTotals[index] += pay; });
                                departmentTotals[row.department] = (departmentTotals[row.department] || 0) + row.totalOT;
                            });

                            const chartData = monthlyHourTotals.map((hours, i) => ({
                                name: new Date(0, i).toLocaleString('en', { month: 'short' }),
                                'OT Hours': hours,
                                'OT Pay': monthlyPayTotals[i],
                            }));
                            const topDepartment = Object.entries(departmentTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
                            
                            const kpis: Kpi[] = [
                                { 
                                    title: 'totalOtHours', 
                                    value: totalOTAllThisYear.toLocaleString('en-US', { maximumFractionDigits: 0 }), 
                                    icon: 'ClockIcon', 
                                    color: 'text-brand-primary',
                                    comparison: hoursComparison,
                                    trendDirection: isDecreaseGood(hoursComparison)
                                },
                                { 
                                    title: 'totalOtPay', 
                                    value: `฿${totalOTPayAllThisYear.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 
                                    icon: 'CurrencyDollarIcon', 
                                    color: 'text-brand-success',
                                    comparison: payComparison,
                                    trendDirection: isDecreaseGood(payComparison)
                                },
                                { 
                                    title: 'totalEmployeesOt', 
                                    value: totalEmployeesThisYear.toLocaleString(), 
                                    icon: 'UsersIcon', 
                                    color: 'text-brand-secondary',
                                    comparison: employeesComparison,
                                    trendDirection: isDecreaseGood(employeesComparison)
                                },
                                { title: 'topDepartmentOt', value: topDepartment[0], icon: 'BuildingOfficeIcon', color: 'text-brand-warning' }
                            ];

                             const deptData = thisYearData.reduce((acc, row) => {
                                const dept = row.department || 'Unknown';
                                if (!acc[dept]) {
                                    acc[dept] = {
                                        employees: new Set(),
                                        totalOt: 0,
                                    };
                                }
                                acc[dept].employees.add(row.employeeId);
                                acc[dept].totalOt += row.totalOT;
                                return acc;
                            }, {} as Record<string, { employees: Set<string>, totalOt: number }>);

                            const otAveragesByDept: OtAverageRow[] = Object.entries(deptData).map(([department, data]) => {
                                const totalOtHours = data.totalOt;
                                const employeeCount = data.employees.size;
                                return {
                                    department,
                                    employeeCount,
                                    totalOtHours,
                                    avgOtHoursPerMonth: employeeCount > 0 ? (totalOtHours / 12) / employeeCount : 0,
                                    avgOtHoursPerWeek: employeeCount > 0 ? (totalOtHours / 52.14) / employeeCount : 0,
                                };
                            });

                            processedData.otReport = { tableData: thisYearData, kpis, chartData, otAveragesByDept };
                            break;
                        }
                        case 'leaveReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                            if (sheetData.length < 2) throw new Error("Leave Report sheet is empty.");

                            const tableData: LeaveRow[] = sheetData.slice(1).map((row, index) => {
                                if (!row || row.length < 31) return null;
                                const monthlyLeave = Array.from({ length: 12 }, (_, i) => parseValue(row[7 + i]) || 0);
                                return {
                                    id: String(row[0] || index + 1), employeeId: String(row[1] || ''), name: String(row[2] || ''),
                                    position: String(row[3] || ''), department: String(row[4] || ''), grade: String(row[5] || ''),
                                    status: String(row[6] || ''), monthlyLeave: monthlyLeave,
                                    leaveWithoutVacation: parseValue(row[19]) || 0, totalLeaveWithVacation: parseValue(row[20]) || 0,
                                    vacationCarriedOver: parseValue(row[21]) || 0, vacationEntitlement: parseValue(row[22]) || 0,
                                    totalVacation: parseValue(row[23]) || 0, vacationUsed: parseValue(row[24]) || 0,
                                    vacationAccrued: parseValue(row[25]) || 0, sickLeave: parseValue(row[26]) || 0,
                                    personalLeave: parseValue(row[27]) || 0, birthdayLeave: parseValue(row[28]) || 0,
                                    otherLeave: parseValue(row[29]) || 0, totalLeave: parseValue(row[30]) || 0,
                                };
                            }).filter((r): r is LeaveRow => r !== null && r.employeeId !== '');

                            const monthlyTotals = Array(12).fill(0);
                            const departmentTotals: { [key: string]: number } = {};
                            const leaveTypeTotals = { 'Sick': 0, 'Personal': 0, 'Birthday': 0, 'Other': 0, 'Vacation': 0 };
                            let totalLeaveAll = 0;

                            tableData.forEach(row => {
                                const nonVacationRatio = (row.totalLeave || 0) > 0 ? (row.leaveWithoutVacation || 0) / (row.totalLeave || 1) : 0;
                                row.monthlyLeave.forEach((leave, index) => {
                                    monthlyTotals[index] += (leave * nonVacationRatio);
                                });

                                departmentTotals[row.department] = (departmentTotals[row.department] || 0) + row.leaveWithoutVacation;
                                leaveTypeTotals['Sick'] += row.sickLeave;
                                leaveTypeTotals['Personal'] += row.personalLeave;
                                leaveTypeTotals['Birthday'] += row.birthdayLeave;
                                leaveTypeTotals['Other'] += row.otherLeave;
                                leaveTypeTotals['Vacation'] += row.vacationUsed;
                                totalLeaveAll += row.leaveWithoutVacation;
                            });

                            const chartData = monthlyTotals.map((total, i) => ({ name: new Date(0, i).toLocaleString('en', { month: 'short' }), value: total }));
                            const topDepartment = Object.entries(departmentTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
                            
                            const nonVacationLeaveTypes = { ...leaveTypeTotals };
                            delete (nonVacationLeaveTypes as any)['Vacation'];
                            const topLeaveType = Object.entries(nonVacationLeaveTypes).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
                            
                            const topMonthIndex = monthlyTotals.indexOf(Math.max(...monthlyTotals));

                            const kpis: Kpi[] = [
                                { title: 'totalLeaveDays', value: Math.round(totalLeaveAll).toLocaleString('en-US'), icon: 'CalendarDaysIcon', color: 'text-brand-primary' },
                                { title: 'topLeaveType', value: topLeaveType[0], icon: 'ClipboardDocumentCheckIcon', color: 'text-brand-secondary' },
                                { title: 'topDepartmentLeave', value: topDepartment[0], icon: 'BuildingOfficeIcon', color: 'text-brand-warning' },
                                { title: 'topMonthLeave', value: new Date(0, topMonthIndex).toLocaleString('en', { month: 'short' }), icon: 'ChartBarIcon', color: 'text-brand-success' }
                            ];

                            processedData.leaveReport = { tableData, kpis, chartData };
                            break;
                        }
                        case 'accidentReport':
                        case 'accidentWh1Report': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                            if (sheetData.length < 2) throw new Error("Accident Report sheet is empty.");

                            const tableData: AccidentRow[] = sheetData.slice(1).map(row => {
                                if (!row || row.length < 18 || (!row[6] && !row[7])) return null;
                                return {
                                    id: String(row[0] || ''), incidentDate: parseExcelDate(row[1]), incidentTime: String(row[2] || ''),
                                    severity: String(row[3] || ''), occurrence: String(row[4] || ''), department: String(row[5] || ''),
                                    employeeId: String(row[6] || ''), employeeName: String(row[7] || ''), position: String(row[8] || ''),
                                    details: String(row[9] || ''), cause: String(row[10] || ''), prevention: String(row[11] || ''),
                                    damageValue: parseValue(row[12]) || 0, insuranceClaim: String(row[13] || ''),
                                    actionTaken: String(row[14] || ''), penalty: String(row[15] || ''),
                                    remarks: String(row[16] || ''), accidentLocation: String(row[17] || ''),
                                };
                            }).filter((r): r is AccidentRow => r !== null);

                            const departmentTotals: { [key: string]: number } = {};
                            const severityTotals: { [key: string]: number } = {};
                            let totalDamage = 0;
                            tableData.forEach(row => {
                                if (row.department) departmentTotals[row.department] = (departmentTotals[row.department] || 0) + 1;
                                if (row.severity) severityTotals[row.severity] = (severityTotals[row.severity] || 0) + 1;
                                totalDamage += row.damageValue;
                            });

                            const chartData = Object.entries(departmentTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                            const topDepartment = chartData[0] || { name: 'N/A', value: 0 };
                            const topSeverity = Object.entries(severityTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

                            const kpis: Kpi[] = [
                                { title: 'totalIncidents', value: tableData.length.toLocaleString(), icon: 'ExclamationTriangleIcon', color: 'text-brand-danger' },
                                { title: 'totalDamage', value: `฿${totalDamage.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`, icon: 'CurrencyDollarIcon', color: 'text-brand-warning' },
                                { title: 'topDepartmentAccident', value: topDepartment.name, icon: 'BuildingOfficeIcon', color: 'text-brand-primary' },
                                { title: 'topSeverity', value: topSeverity[0], icon: 'ClipboardDocumentCheckIcon', color: 'text-brand-secondary' }
                            ];

                            if (activePage === 'accidentReport') {
                                processedData.accidentReport = { tableData, kpis, chartData };
                            } else {
                                processedData.accidentWh1Report = { tableData, kpis, chartData };
                            }
                            break;
                        }

                        case 'workloadReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                            if (sheetData.length < 2) throw new Error("Workload Report sheet is empty.");

                            const data: WorkloadProductSection[] = [];
                            let currentProductSection: WorkloadProductSection | null = null;
                            sheetData.slice(1).forEach(row => {
                                if (!row || row.every(cell => cell === null)) return;
                                const productCell = row[0];
                                const descriptionCell = row[1];
                                if (productCell && typeof productCell === 'string' && productCell.trim() !== '') {
                                    if (currentProductSection) data.push(currentProductSection);
                                    currentProductSection = {
                                        product: productCell.trim(),
                                        isSubProduct: productCell.trim() === 'Ton/Person/Hr.',
                                        rows: []
                                    };
                                }
                                if (descriptionCell && typeof descriptionCell === 'string' && descriptionCell.trim() !== '' && currentProductSection) {
                                    const description = descriptionCell.trim();
                                    const values = row.slice(3, 15).map(v => parseValue(v));
                                    const nonSubRowPrefixes = ['Sum', 'Manpower', 'Workday', 'Working Hours', 'OT'];
                                    currentProductSection.rows.push({
                                        description,
                                        isSubRow: !nonSubRowPrefixes.some(prefix => description.startsWith(prefix)),
                                        unit: row[2] || '',
                                        values,
                                        average: parseValue(row[16]),
                                        min: parseValue(row[17]),
                                        max: parseValue(row[18])
                                    });
                                }
                            });
                            if (currentProductSection) data.push(currentProductSection);

                            processedData.workloadReport = { data };
                            break;
                        }
                        case 'manpowerReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                            if (json.length < 2) throw new Error("Uploaded sheet is empty.");

                            const headers = json[0].map(h => typeof h === 'string' ? h.trim() : '');

                            const isManpowerFile = headers.includes('MANPOWER') && headers.includes('CURRENT');

                            if (isManpowerFile) {
                                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
                                const tableData: ManpowerRow[] = jsonData.map(row => ({
                                    id: String(row['NO.'] || ''),
                                    employeeId: String(row['EMP.'] || ''),
                                    name: String(row['NAME-SURENAME'] || ''),
                                    position: String(row['POSITION'] || ''),
                                    department: String(row['DEPT.'] || 'N/A'),
                                    grade: String(row['Grade'] || ''),
                                    status: String(row['STATUS'] || 'Unknown'),
                                    manpower: String(row['MANPOWER'] || ''),
                                    current: String(row['CURRENT'] || ''),
                                    hireDate: row['HIRE DATE'] ? parseExcelDate(row['HIRE DATE']) : undefined,
                                    terminationDate: row['ทำงานวันสุดท้าย'] ? parseExcelDate(row['ทำงานวันสุดท้าย']) : undefined,
                                }));

                                const totalManpower = tableData.reduce((sum, row) => sum + (parseValue(row.manpower) || 0), 0);
                                const totalCurrent = tableData.reduce((sum, row) => sum + (parseValue(row.current) || 0), 0);
                                const additionalManpowerNeeded = Math.max(0, totalManpower - totalCurrent);
                                const departmentCount = new Set(tableData.map(e => e.department)).size;
                                
                                const currentPercentage = totalManpower > 0 ? (totalCurrent / totalManpower) * 100 : 0;
                                const neededPercentage = totalManpower > 0 ? (additionalManpowerNeeded / totalManpower) * 100 : 0;

                                const kpis: Kpi[] = [
                                    { title: 'manpowerTotal', value: totalManpower.toString(), icon: 'UserGroupIcon', color: 'text-brand-success', subValue: '(100%)', subValuePosition: 'bottom' },
                                    { title: 'totalEmployees', value: totalCurrent.toString(), subValue: `(${currentPercentage.toFixed(2)}%)`, icon: 'UsersIcon', color: 'text-brand-primary', subValuePosition: 'bottom' },
                                    { title: 'additionalManpowerNeeded', value: additionalManpowerNeeded.toString(), subValue: `(${neededPercentage.toFixed(2)}%)`, icon: 'UserGroupIcon', color: 'text-brand-warning', subValuePosition: 'bottom' },
                                    { title: 'totalDepartments', value: departmentCount.toString(), icon: 'BuildingOfficeIcon', color: 'text-brand-secondary' },
                                ];
                                
                                const statusChartData: ChartDataPoint[] = [
                                    { name: t('manpowerTotal' as any), value: totalManpower },
                                    { name: t('currentTotal' as any), value: totalCurrent },
                                ];

                                const deptCounts = tableData.reduce((acc, emp) => {
                                    acc[emp.department] = (acc[emp.department] || 0) + 1;
                                    return acc;
                                }, {} as {[key: string]: number});

                                const deptChartData = Object.entries(deptCounts)
                                    .map(([name, value]) => ({ name, value }))
                                    .sort((a, b) => b.value - a.value)
                                    .slice(0, 10);

                                const departmentDataMap = tableData.reduce((acc, row) => {
                                    const dept = row.department || 'N/A';
                                    if (!acc[dept]) {
                                        acc[dept] = {
                                            department: dept,
                                            manpower: 0,
                                            current: 0,
                                            neededPositions: []
                                        };
                                    }
                                    const manpower = parseValue(row.manpower) || 0;
                                    const current = parseValue(row.current) || 0;
                                    const neededCount = manpower - current;

                                    acc[dept].manpower += manpower;
                                    acc[dept].current += current;

                                    if (neededCount > 0) {
                                        const existingPosition = acc[dept].neededPositions.find(p => p.position === row.position);
                                        if (existingPosition) {
                                            existingPosition.count += neededCount;
                                        } else {
                                            acc[dept].neededPositions.push({
                                                position: row.position,
                                                count: neededCount
                                            });
                                        }
                                    }
                                    return acc;
                                }, {} as { [key: string]: { department: string; manpower: number; current: number; neededPositions: { position: string; count: number }[] } });

                                const departmentComparisonData: DepartmentComparison[] = Object.values(departmentDataMap)
                                    .map(deptData => ({
                                        ...deptData,
                                        needed: Math.max(0, deptData.manpower - deptData.current),
                                        neededPositions: deptData.neededPositions.sort((a, b) => b.count - a.count)
                                    }))
                                    .sort((a, b) => a.department.localeCompare(b.department));
                                
                                processedData.manpowerReport = { tableData, kpis, statusChartData, deptChartData, departmentComparisonData };
                            } else {
                                throw new Error("The uploaded Excel file does not match the expected format for Manpower.");
                            }
                            break;
                        }
                        case 'warningLetterReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                            if (sheetData.length < 2) throw new Error("Warning Letter sheet is empty or has no data rows.");
                            
                            const rows = sheetData.slice(1);
                            
                            const tableData: WarningLetterRow[] = rows.map((row): WarningLetterRow | null => {
                                // Robust check: Skip rows that don't have an Employee ID (row[2]) or Employee Name (row[3])
                                if (!row || row.length < 12 || (!row[2] && !row[3])) return null;
                                
                                return {
                                    id: String(row[0] || ''),
                                    date: parseExcelDate(row[1]),
                                    employeeId: String(row[2] || ''),
                                    employeeName: String(row[3] || ''),
                                    department: String(row[4] || 'Unknown'),
                                    reason: String(row[5] || ''),
                                    warningId: String(row[6] || ''),
                                    damageValue: parseValue(row[7]) || 0,
                                    type: String(row[8] || 'Unknown'),
                                    hrSentDate: parseExcelDate(row[9]),
                                    hrInvestigationDate: parseExcelDate(row[10]),
                                    hrWarningReceivedDate: parseExcelDate(row[11]),
                                    documentStatus: String(row[12] || ''),
                                };
                            }).filter((r): r is WarningLetterRow => r !== null);


                            const totalWarnings = tableData.length;
                            const verbalWarnings = tableData.filter(r => String(r.type).trim().includes('วาจา')).length;
                            const writtenWarnings = tableData.filter(r => String(r.type).trim().includes('ลายลักษณ์อักษร')).length;
                            const totalDamageValue = tableData.reduce((sum, row) => sum + (row.damageValue || 0), 0);

                            const verbalPercentage = totalWarnings > 0 ? (verbalWarnings / totalWarnings) * 100 : 0;
                            const writtenPercentage = totalWarnings > 0 ? (writtenWarnings / totalWarnings) * 100 : 0;

                            const kpis: Kpi[] = [
                                { title: 'totalWarnings', value: totalWarnings.toString(), icon: 'ExclamationTriangleIcon', color: 'text-brand-danger', subValue: '(100%)', subValuePosition: 'bottom' },
                                { title: 'verbalWarnings', value: verbalWarnings.toString(), subValue: `(${(verbalPercentage).toFixed(0)}%)`, icon: 'ClipboardDocumentCheckIcon', color: 'text-brand-warning', subValuePosition: 'bottom' },
                                { title: 'writtenWarnings', value: writtenWarnings.toString(), subValue: `(${(writtenPercentage).toFixed(0)}%)`, icon: 'DocumentTextIcon', color: 'text-brand-secondary', subValuePosition: 'bottom' },
                                { title: 'totalDamage', value: `฿${totalDamageValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`, icon: 'CurrencyDollarIcon', color: 'text-brand-primary' }
                            ];

                            const deptCountsByType = tableData.reduce((acc, row) => {
                                const dept = row.department || 'Unknown';
                                if (!acc[dept]) {
                                    acc[dept] = { verbal: 0, written: 0, other: 0 };
                                }
                                const type = String(row.type).trim();
                                if (type.includes('วาจา')) {
                                    acc[dept].verbal++;
                                } else if (type.includes('ลายลักษณ์อักษร')) {
                                    acc[dept].written++;
                                } else {
                                    acc[dept].other++;
                                }
                                return acc;
                            }, {} as { [key: string]: { verbal: number; written: number; other: number } });

                            const byDeptChartData: ChartDataPoint[] = Object.entries(deptCountsByType)
                                .map(([name, counts]) => ({
                                    name,
                                    verbal: counts.verbal,
                                    written: counts.written,
                                    other: counts.other,
                                    value: counts.verbal + counts.written + counts.other,
                                }))
                                .sort((a, b) => (b.value || 0) - (a.value || 0));
                                
                            const byTypeChartData: ChartDataPoint[] = [
                                { name: t('verbalWarnings'), value: verbalWarnings },
                                { name: t('writtenWarnings'), value: writtenWarnings },
                                { name: 'Other', value: totalWarnings - verbalWarnings - writtenWarnings },
                            ].filter(d => d.value > 0);

                            const damageByDept = tableData.reduce((acc, row) => {
                                const dept = row.department || 'Unknown';
                                const damage = row.damageValue || 0;
                                if (damage > 0) {
                                    acc[dept] = (acc[dept] || 0) + damage;
                                }
                                return acc;
                            }, {} as { [key: string]: number });

                            const damageByDeptChartData: ChartDataPoint[] = Object.entries(damageByDept)
                                .map(([name, value]) => ({ name, value }))
                                .sort((a, b) => b.value - a.value);

                            processedData.warningLetterReport = { tableData, kpis, byDeptChartData, byTypeChartData, damageByDeptChartData };
                            break;
                        }
                        case 'turnoverReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
                        
                            const tableData: TurnoverRow[] = jsonData.map(row => ({
                                id: String(row['NO.'] || ''),
                                employeeId: String(row['EMP.'] || ''),
                                name: String(row['NAME-SURENAME'] || ''),
                                position: String(row['POSITION'] || ''),
                                status: String(row['สถานะ'] || ''),
                                costCenter: String(row['COST CENTER'] || ''),
                                department: String(row['DEPT.'] || 'N/A'),
                                grade: String(row['Grade'] || ''),
                                hireDateBuddhist: row['วันเริ่มงาน (พ.ศ.)'] ? parseExcelDate(row['วันเริ่มงาน (พ.ศ.)']) : '',
                                hireDate: row['วันเริ่มงาน (ค.ศ.)'] ? parseExcelDate(row['วันเริ่มงาน (ค.ศ.)']) : '',
                                tenureYears: parseValue(row['อายุงาน (ปี)']) || 0,
                                tenureMonths: parseValue(row['อายุงาน (เดือน)']) || 0,
                                tenureDays: parseValue(row['อายุงาน (วัน)']) || 0,
                                probationPassDate: row['วันที่ผ่านทดลองงาน'] ? parseExcelDate(row['วันที่ผ่านทดลองงาน']) : '',
                                nickname: String(row['ชื่อเล่น'] || ''),
                                now: row['=Now'] ? parseExcelDate(row['=Now']) : '',
                                dob: row['วัน-เดือน-ปีเกิด'] ? parseExcelDate(row['วัน-เดือน-ปีเกิด']) : '',
                                age: parseValue(row['อายุ']) || 0,
                                religion: String(row['ศาสนา'] || ''),
                                mobile: String(row['โทรศัพท์มือถือ'] || ''),
                                hometown: String(row['ภูมิลำเนา'] || ''),
                                education: String(row['วุฒิการศึกษา'] || ''),
                                employmentType: String(row['STATUS'] || ''),
                                terminationDate: row['ทำงานวันสุดท้าย'] ? parseExcelDate(row['ทำงานวันสุดท้าย']) : '',
                                effectiveDate: row['วันที่มีผล'] ? parseExcelDate(row['วันที่มีผล']) : '',
                                reasonForLeaving: String(row['สาเหตุการลาออก'] || ''),
                            })).filter(r => r.employeeId);
                        
                            processedData.turnoverReport = { 
                                tableData, 
                                kpis: [], 
                                monthlyChartData: [], 
                                reasonChartData: [], 
                                deptChartData: [] 
                            };
                            break;
                        }
                        case 'purchaseRequestReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
                            
                            const mapPurchaseStatus = (status: string | undefined): PurchaseRequestRow['status'] => {
                                if (!status) return 'Pending';
                                const s = String(status).trim().toLowerCase();
                                if (s.includes('อนุมัติ') || s.includes('approved')) return 'Approved';
                                if (s.includes('เสร็จสมบูรณ์') || s.includes('completed')) return 'Completed';
                                if (s.includes('สั่งซื้อแล้ว') || s.includes('ordered')) return 'Ordered';
                                if (s.includes('ปฏิเสธ') || s.includes('rejected')) return 'Rejected';
                                if (s.includes('pending') || s.includes('รอ')) return 'Pending';
                                
                                const validStatuses: PurchaseRequestRow['status'][] = ['Pending', 'Approved', 'Rejected', 'Ordered', 'Completed'];
                                const originalStatus = String(status).trim() as PurchaseRequestRow['status'];
                                if (validStatuses.includes(originalStatus)) {
                                    return originalStatus;
                                }
                                return 'Pending';
                            };

                            const tableData: PurchaseRequestRow[] = jsonData.map((row): PurchaseRequestRow | null => {
                                if (!row['เลขที่ PR']) return null;
                        
                                const prOpenDateStr = parseExcelDate(row['วันที่เปิด PR']);
                                const receivedDateStr = parseExcelDate(row['วันที่รับสินค้า']);
                        
                                let leadTimeDays = 0;
                                const parseDMY = (dateString: string) => {
                                    if (!dateString) return null;
                                    const parts = dateString.split('/');
                                    if (parts.length !== 3) return null;
                                    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                }
                        
                                const startDate = parseDMY(prOpenDateStr);
                                const endDate = parseDMY(receivedDateStr);
                        
                                if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
                                    const diffTime = endDate.getTime() - startDate.getTime();
                                    leadTimeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                                }
                        
                                return {
                                    id: String(row['เลขที่ PR']),
                                    date: prOpenDateStr,
                                    requester: '', 
                                    department: String(row['ส่วนงาน'] || 'Unknown'),
                                    itemDescription: String(row['รายการสั่งซื้อ'] || ''),
                                    quantity: parseValue(row['จำนวน']) || 0,
                                    unit: String(row['หน่วย'] || ''),
                                    unitPrice: parseValue(row['ราคา/หน่วย']) || 0,
                                    totalPrice: parseValue(row['รวมจำนวนเงิน']) || 0,
                                    supplier: '', 
                                    status: mapPurchaseStatus(row['สถานะ']),
                                    objective: String(row['วัตถุประสงค์'] || ''),
                                    goodsReceivedDate: receivedDateStr,
                                    leadTimeDays: leadTimeDays,
                                };
                            }).filter((r): r is PurchaseRequestRow => r !== null);
                        
                            const totalRequests = tableData.length;
                            const totalValue = tableData.filter(r => ['Approved', 'Ordered', 'Completed'].includes(r.status)).reduce((sum, r) => sum + r.totalPrice, 0);
                            const pendingRequests = tableData.filter(r => r.status === 'Pending').length;
                            
                            const deptValue = tableData.reduce((acc, row) => {
                                if (['Approved', 'Ordered', 'Completed'].includes(row.status)) {
                                    acc[row.department] = (acc[row.department] || 0) + row.totalPrice;
                                }
                                return acc;
                            }, {} as Record<string, number>);
                            
                            const topDepartment = Object.entries(deptValue).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
                            
                            const kpis: Kpi[] = [
                                { title: 'totalRequests', value: totalRequests.toString(), icon: 'ClipboardDocumentListIcon', color: 'text-brand-primary' },
                                { title: 'totalApprovedValue', value: `฿${totalValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`, icon: 'CurrencyDollarIcon', color: 'text-brand-success' },
                                { title: 'pendingRequests', value: pendingRequests.toString(), icon: 'ClockIcon', color: 'text-brand-warning' },
                                { title: 'topDeptByValue', value: topDepartment, icon: 'BuildingOfficeIcon', color: 'text-brand-secondary' },
                            ];
                        
                            const byDeptChartData: ChartDataPoint[] = Object.entries(deptValue).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
                        
                            const statusCounts = tableData.reduce((acc, row) => {
                                acc[row.status] = (acc[row.status] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);
                        
                            const byStatusChartData: ChartDataPoint[] = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
                        
                            const getYear = (dateStr: string) => {
                                if (!dateStr) return null;
                                const parts = dateStr.split('/');
                                return parts.length === 3 ? parseInt(parts[2], 10) : null;
                            };
                            const years = tableData.map(r => getYear(r.date)).filter((y): y is number => y !== null);
                            const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

                            const monthlyTotals = Array(12).fill(0);
                            tableData.forEach(row => {
                                if (!row.date) return;
                                const dateParts = row.date.split('/');
                                if (dateParts.length !== 3) return;
                                const year = parseInt(dateParts[2], 10);
                                if (year !== latestYear) return;
                                const month = parseInt(dateParts[1], 10) - 1;
                                if (month >= 0 && month < 12) {
                                    monthlyTotals[month] += row.totalPrice || 0;
                                }
                            });
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthlyChartData = monthNames.map((name, index) => ({ name: t(`month${name}` as any), value: monthlyTotals[index] }));

                            processedData.purchaseRequestReport = { tableData, kpis, byDeptChartData, byStatusChartData, monthlyChartData };
                            break;
                        }
                        case 'trainingReport': {
                            processedData.trainingReport = { tableData: [], kpis: [], chartData: [] };
                            break;
                        }
                        default:
                            throw new Error(`No parser available for ${activePage}`);
                    }
                    resolve(processedData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const parsedData = await processFile(file);
            saveData({ ...appData, ...parsedData });
            Swal.fire({ icon: 'success', title: 'Success!', text: 'File processed and data updated.' });
        } catch (e: any) {
            setError(`Error processing file: ${e.message}`);
            Swal.fire({ icon: 'error', title: 'Oops...', text: `Error processing file: ${e.message}` });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activePage, appData, saveData]);

    const handleLoadFromFirestore = async () => {
        if (!isFirebaseConnected()) {
            setError("Firebase not connected.");
            Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Not connected to the database.' });
            return;
        }
        setIsLoading(true);
        try {
            const data = await getFromFirestore<any>('reports');
            if (data.length > 0) {
                const latestReport = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
                const { id, ...reportData } = latestReport;
                setFirestoreDocId(id);
                const mergedData: AppData = {
                    ...initialAppData,
                    kpiReport: { ...initialAppData.kpiReport, ...(reportData.kpiReport || {}) },
                    consumablesReport: { ...initialAppData.consumablesReport, ...(reportData.consumablesReport || {}) },
                    otReport: { ...initialAppData.otReport, ...(reportData.otReport || {}) },
                    leaveReport: { ...initialAppData.leaveReport, ...(reportData.leaveReport || {}) },
                    accidentReport: { ...initialAppData.accidentReport, ...(reportData.accidentReport || {}) },
                    accidentWh1Report: { ...initialAppData.accidentWh1Report, ...(reportData.accidentWh1Report || {}) },
                    workloadReport: { ...initialAppData.workloadReport, ...(reportData.workloadReport || {}) },
                    manpowerReport: { ...initialAppData.manpowerReport, ...(reportData.manpowerReport || {}) },
                    warningLetterReport: { ...initialAppData.warningLetterReport, ...(reportData.warningLetterReport || {}) },
                    turnoverReport: { ...initialAppData.turnoverReport, ...(reportData.turnoverReport || {}) },
                    trainingReport: { ...initialAppData.trainingReport, ...(reportData.trainingReport || {}) },
                    purchaseRequestReport: { ...initialAppData.purchaseRequestReport, ...(reportData.purchaseRequestReport || {}) },
                };
                saveData(mergedData);
                Swal.fire({ icon: 'success', title: 'Data Loaded', text: 'Latest data loaded from the cloud.' });
            } else {
                Swal.fire({ icon: 'info', title: 'No Data', text: 'No data found in the cloud.' });
            }
        } catch (e) {
            setError("Failed to load data from Cloud.");
            Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Could not retrieve data from the cloud.' });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearData = () => {
        const pageConfig: { [key: string]: { name: string; dataKey: keyof AppData | (keyof AppData)[] } } = {
            kpiReport: { name: t('kpiReport'), dataKey: 'kpiReport' },
            consumablesReport: { name: t('consumablesReport'), dataKey: 'consumablesReport' },
            otReport: { name: t('otReport'), dataKey: 'otReport' },
            leaveReport: { name: t('leaveReport'), dataKey: 'leaveReport' },
            accidentReport: { name: t('accidentReport'), dataKey: 'accidentReport' },
            accidentWh1Report: { name: t('accidentWh1Report'), dataKey: 'accidentWh1Report' },
            workloadReport: { name: t('workloadReport'), dataKey: 'workloadReport' },
            manpowerReport: { name: t('manpowerReport'), dataKey: 'manpowerReport' },
            warningLetterReport: { name: t('warningLetterReport'), dataKey: 'warningLetterReport' },
            turnoverReport: { name: t('turnoverReport' as any), dataKey: 'turnoverReport' },
            purchaseRequestReport: { name: t('purchaseRequestReport' as any), dataKey: 'purchaseRequestReport' },
            trainingReport: { name: t('trainingReport' as any), dataKey: 'trainingReport' },
        };
        
        const config = pageConfig[activePage];
        if (!config) {
            Swal.fire('Error', 'Cannot clear data for this page.', 'error');
            return;
        }

        Swal.fire({
            title: `Delete ${config.name} Data?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result: any) => {
            if (result.isConfirmed) {
                let newAppData = { ...appData };
                if (Array.isArray(config.dataKey)) {
                    config.dataKey.forEach(key => {
                        newAppData[key] = initialAppData[key];
                    });
                } else {
                    newAppData[config.dataKey] = initialAppData[config.dataKey];
                }
                saveData(newAppData);
                Swal.fire('Deleted!', `${config.name} data has been cleared.`, 'success');
            }
        });
    };
    
    const handleNavigate = (page: string) => {
        setActivePage(page);
        setIsSidebarOpen(false);
    };

    const renderActivePage = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

        switch (activePage) {
            case 'kpiReport':
                return <KpiReport kpis={appData.kpiReport.kpis} tableRows={appData.kpiReport.tableRows} theme={theme} />;
            case 'consumablesReport':
                return <ConsumablesReport {...appData.consumablesReport} theme={theme} />;
            case 'otReport':
                return <OTReport {...appData.otReport} theme={theme} />;
            case 'leaveReport':
                return <LeaveReport {...appData.leaveReport} theme={theme} />;
            case 'accidentReport':
                return <AccidentReport {...appData.accidentReport} theme={theme} noDataMessageKey="noDataLoadedMessageAccident" />;
            case 'accidentWh1Report':
                return <AccidentReport {...appData.accidentWh1Report} theme={theme} noDataMessageKey="noDataLoadedMessageAccidentWh1" />;
            case 'workloadReport':
                return <WorkloadReport data={appData.workloadReport.data} theme={theme} />;
            case 'manpowerReport':
                return <ManpowerReport 
                    manpowerData={appData.manpowerReport}
                    theme={theme}
                />;
            case 'warningLetterReport':
                return <WarningLetterReport {...appData.warningLetterReport} theme={theme} />;
            case 'turnoverReport':
                return <TurnoverReport 
                    turnoverData={appData.turnoverReport} 
                    manpowerData={appData.manpowerReport} 
                    theme={theme} 
                />;
            case 'purchaseRequestReport':
                return <PurchaseRequestReport {...appData.purchaseRequestReport} theme={theme} />;
            case 'trainingReport':
            case 'comparisonReport':
            case 'reports':
            case 'documents':
            case 'settings':
            case 'helpCenter':
                return <PlaceholderPage title={t(activePage as any)} />;
            default:
                return <PlaceholderPage title="Dashboard" />;
        }
    };
    
    const pageTitle = useMemo(() => {
        const titleKey = activePage as any;
        if (activePage === 'manpowerReport') {
            return t('manpowerReport');
        }
        return t(titleKey);
    }, [activePage, t]);

    return (
        <div className={`flex h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary font-sans transition-colors duration-300`}>
            <Sidebar activePage={activePage} onNavigate={handleNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    onFileUpload={handleFileUpload}
                    activePage={activePage}
                    pageTitle={pageTitle}
                    theme={theme}
                    toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    onLoadFromFirestore={handleLoadFromFirestore}
                    onClearData={handleClearData}
                />
                <main className="flex-1 overflow-y-auto p-6 sm:p-6 lg:p-10">
                    <div className="max-w-[1600px] mx-auto">
                        {renderActivePage()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
