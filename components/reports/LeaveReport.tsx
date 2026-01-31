
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, LeaveRow } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '../icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface LeaveReportProps {
    tableData: LeaveRow[];
    kpis: Kpi[];
    chartData: ChartDataPoint[];
    theme: 'light' | 'dark';
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{label}</span>
        <span className="text-light-text-primary dark:text-dark-text-primary mt-1">{value || '-'}</span>
    </div>
);

const LeaveReport: React.FC<LeaveReportProps> = ({ tableData, kpis, chartData, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
    const [selectedTopEmployee, setSelectedTopEmployee] = useState<LeaveRow | null>(null);
    const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
    const [leaveTypeDetails, setLeaveTypeDetails] = useState<{ department: string; days: number }[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [departmentLeaveDetails, setDepartmentLeaveDetails] = useState<{ leaveType: string; days: number }[]>([]);

    const monthNames = useMemo(() => [
        t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'),
        t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')
    ], [t]);
    
    const headers = useMemo(() => [
        t('headerNo'), t('headerNameSurname'), t('headerPosition'), t('headerDept'), t('headerTotal')
    ], [t]);

    const filteredData = useMemo(() => tableData.filter(row => {
        const searchString = searchTerm.toLowerCase();
        return Object.values(row).some(val => String(val).toLowerCase().includes(searchString));
    }), [tableData, searchTerm]);

    const topEmployees = useMemo(() => [...tableData].sort((a, b) => (b.leaveWithoutVacation || 0) - (a.leaveWithoutVacation || 0)).slice(0, 10), [tableData]);
    
    const topSickLeaveEmployees = useMemo(() => 
        [...tableData]
        .filter(e => e.sickLeave > 0)
        .sort((a, b) => (b.sickLeave || 0) - (a.sickLeave || 0))
        .slice(0, 10), 
    [tableData]);
    
    const topPersonalLeaveEmployees = useMemo(() => 
        [...tableData]
        .filter(e => e.personalLeave > 0)
        .sort((a, b) => (b.personalLeave || 0) - (a.personalLeave || 0))
        .slice(0, 10), 
    [tableData]);
    
    const topLeaveTypes = useMemo(() => {
        const leaveTypes: { [key: string]: number } = {
            [t('leaveTypeSick')]: 0,
            [t('leaveTypePersonal')]: 0,
            [t('leaveTypeBirthday')]: 0,
            [t('leaveTypeOther')]: 0,
        };
    
        tableData.forEach(row => {
            leaveTypes[t('leaveTypeSick')] += (row.sickLeave || 0);
            leaveTypes[t('leaveTypePersonal')] += (row.personalLeave || 0);
            leaveTypes[t('leaveTypeBirthday')] += (row.birthdayLeave || 0);
            leaveTypes[t('leaveTypeOther')] += (row.otherLeave || 0);
        });
    
        return Object.entries(leaveTypes)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
    }, [tableData, t]);
    
    const topDepartments = useMemo(() => {
        const totals: { [key: string]: number } = {};
        tableData.forEach(row => {
            const department = row.department || 'Unknown';
            totals[department] = (totals[department] || 0) + (row.leaveWithoutVacation || 0);
        });
        return Object.entries(totals).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [tableData]);

    const employeesWithNoLeave = useMemo(() => {
        if (!tableData || tableData.length === 0) {
            return [];
        }

        let lastMonthWithData = -1;
        // Find the most recent month across all data that has any leave recorded
        tableData.forEach(row => {
            for (let i = 11; i >= 0; i--) {
                if (row.monthlyLeave[i] > 0) {
                    if (i > lastMonthWithData) {
                        lastMonthWithData = i;
                    }
                    break; 
                }
            }
        });

        // If no leave was taken by anyone all year, assume the whole year data is relevant.
        // We'll check the last 6 months of the year in this case.
        if (lastMonthWithData === -1) {
            lastMonthWithData = 11; 
        }

        const endMonthIndex = lastMonthWithData;
        const startMonthIndex = Math.max(0, endMonthIndex - 5);
        
        return tableData.filter(employee => {
            // Check only the last 6 relevant months
            const leaveInPeriod = employee.monthlyLeave.slice(startMonthIndex, endMonthIndex + 1);
            const totalLeave = leaveInPeriod.reduce((sum, current) => sum + current, 0);
            return totalLeave === 0;
        });

    }, [tableData]);

    const groupedData = useMemo(() => {
        const groups: { [key: string]: { rows: LeaveRow[], totalLeave: number } } = {};
        filteredData.forEach(row => {
            const dept = row.department || 'Unknown';
            if (!groups[dept]) {
                groups[dept] = { rows: [], totalLeave: 0 };
            }
            groups[dept].rows.push(row);
            groups[dept].totalLeave += row.leaveWithoutVacation || 0;
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredData]);

    useEffect(() => {
        if (searchTerm !== '') {
            setExpandedDepts(new Set(groupedData.map(g => g[0])));
        } else if (groupedData.length > 0) {
            setExpandedDepts(new Set([groupedData[0][0]]));
        } else {
            setExpandedDepts(new Set());
        }
    }, [groupedData, searchTerm]);

    const handleDeptToggle = (dept: string) => {
        setExpandedDepts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(dept)) {
                newSet.delete(dept);
            } else {
                newSet.add(dept);
            }
            return newSet;
        });
        setExpandedEmployeeId(null); // Collapse employee row when department is toggled
    };

    const handleEmployeeToggle = (employeeId: string) => {
        setExpandedEmployeeId(prevId => (prevId === employeeId ? null : employeeId));
    };

    const handleLeaveTypeClick = (leaveTypeName: string) => {
        let leaveKey: keyof LeaveRow | null = null;
        if (leaveTypeName === t('leaveTypeVacation')) leaveKey = 'vacationUsed';
        else if (leaveTypeName === t('leaveTypeSick')) leaveKey = 'sickLeave';
        else if (leaveTypeName === t('leaveTypePersonal')) leaveKey = 'personalLeave';
        else if (leaveTypeName === t('leaveTypeBirthday')) leaveKey = 'birthdayLeave';
        else if (leaveTypeName === t('leaveTypeOther')) leaveKey = 'otherLeave';

        if (!leaveKey) return;

        const departmentTotals: { [key: string]: number } = {};
        tableData.forEach(row => {
            const dept = row.department || 'Unknown';
            const leaveDays = row[leaveKey] as number;
            if (typeof leaveDays === 'number') {
                departmentTotals[dept] = (departmentTotals[dept] || 0) + leaveDays;
            }
        });

        const details = Object.entries(departmentTotals)
            .map(([department, days]) => ({ department, days }))
            .sort((a, b) => b.days - a.days);

        setLeaveTypeDetails(details);
        setSelectedLeaveType(leaveTypeName);
    };

    const handleDepartmentClick = (departmentName: string) => {
        const departmentData = tableData.filter(row => (row.department || 'Unknown') === departmentName);
        
        const leaveTypes: { [key: string]: number } = {
            [t('leaveTypeVacation')]: 0,
            [t('leaveTypeSick')]: 0,
            [t('leaveTypePersonal')]: 0,
            [t('leaveTypeBirthday')]: 0,
            [t('leaveTypeOther')]: 0,
        };

        departmentData.forEach(row => {
            leaveTypes[t('leaveTypeVacation')] += (row.vacationUsed || 0);
            leaveTypes[t('leaveTypeSick')] += (row.sickLeave || 0);
            leaveTypes[t('leaveTypePersonal')] += (row.personalLeave || 0);
            leaveTypes[t('leaveTypeBirthday')] += (row.birthdayLeave || 0);
            leaveTypes[t('leaveTypeOther')] += (row.otherLeave || 0);
        });

        const details = Object.entries(leaveTypes)
            .map(([leaveType, days]) => ({ leaveType, days }))
            .sort((a, b) => b.days - a.days);

        setDepartmentLeaveDetails(details);
        setSelectedDepartment(departmentName);
    };

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageLeave')}</p>
                </div>
            </div>
        );
    }
    
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => <KPICard key={index} {...kpi} title={t(kpi.title as any)} />)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('top10SickLeaveEmployees')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={topSickLeaveEmployees}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} tickFormatter={(value: number) => value.toFixed(2)}/>
                            <YAxis
                                type="category" dataKey="name" stroke={tickColor}
                                tick={{ fill: tickColor, fontSize: 12 }}
                                width={120} interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                                formatter={(value: number) => value.toFixed(2)}
                            />
                            <Bar dataKey="sickLeave" name={t('days')} fill="#EF4444">
                                <LabelList dataKey="sickLeave" position="right" style={{ fill: tickColor, fontSize: 12 }} formatter={(value: number) => value.toFixed(2)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('top10PersonalLeaveEmployees')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={topPersonalLeaveEmployees}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} tickFormatter={(value: number) => value.toFixed(2)}/>
                            <YAxis
                                type="category" dataKey="name" stroke={tickColor}
                                tick={{ fill: tickColor, fontSize: 12 }}
                                width={120} interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                                formatter={(value: number) => value.toFixed(2)}
                            />
                            <Bar dataKey="personalLeave" name={t('days')} fill="#F59E0B">
                                <LabelList dataKey="personalLeave" position="right" style={{ fill: tickColor, fontSize: 12 }} formatter={(value: number) => value.toFixed(2)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('top10LeaveEmployees')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={topEmployees}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} tickFormatter={(value: number) => value.toFixed(1)} />
                            <YAxis
                                type="category" dataKey="name" stroke={tickColor}
                                tick={{ fill: tickColor, fontSize: 12 }}
                                width={120} interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                                formatter={(value: number) => `${value.toFixed(2)} ${t('days')}`}
                            />
                            <Bar dataKey="leaveWithoutVacation" name={t('days')} fill="#6366F1">
                                <LabelList dataKey="leaveWithoutVacation" position="right" style={{ fill: tickColor, fontSize: 12 }} formatter={(value: number) => value.toFixed(2)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('top5LeaveDepartments')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={topDepartments}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} tickFormatter={(value: number) => value.toFixed(1)} />
                            <YAxis
                                type="category" dataKey="name" stroke={tickColor}
                                tick={{ fill: tickColor, fontSize: 12 }}
                                width={120} interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                                formatter={(value: number) => `${value.toFixed(2)} ${t('days')}`}
                            />
                            <Bar dataKey="total" name={t('days')} fill="#8B5CF6">
                                <LabelList dataKey="total" position="right" style={{ fill: tickColor, fontSize: 12 }} formatter={(value: number) => value.toFixed(2)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <MainChart data={chartData} title={t('monthlyLeaveDays')} theme={theme} valueFormatter={(value: number) => value.toFixed(2)}/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col h-[480px]">
                    <div className="p-6 border-b border-light-border dark:border-dark-border"><h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('noLeave6MonthsTitle')}</h3></div>
                    <div className="overflow-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-light-border dark:border-dark-border">
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">#</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('headerName')}</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('headerDepartment')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                {employeesWithNoLeave.length > 0 ? (
                                    employeesWithNoLeave.map((e, i) => (
                                        <tr key={e.employeeId} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                                            <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary font-medium">{i + 1}</td>
                                            <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary truncate" title={e.name}>{e.name}</td>
                                            <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{e.department}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center p-8 text-light-text-secondary dark:text-dark-text-secondary">
                                            {t('noResultsFound')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col h-[480px]">
                    <div className="p-6 border-b border-light-border dark:border-dark-border"><h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('top5LeaveTypes')}</h3></div>
                    <div className="overflow-auto"><table className="w-full text-left"><thead><tr className="border-b border-light-border dark:border-dark-border"><th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">#</th><th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('leaveType')}</th><th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('days')}</th></tr></thead><tbody className="divide-y divide-light-border dark:divide-dark-border">{topLeaveTypes.map((lt, i) => <tr key={lt.name} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer" onClick={() => handleLeaveTypeClick(lt.name)}><td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary font-medium">{i+1}</td><td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{lt.name}</td><td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{lt.total.toFixed(2)}</td></tr>)}</tbody></table></div>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4"><h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('employeeLeaveDetails')}</h3><div className="relative"><MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" /><input type="text" placeholder={t('searchEmployees')} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"/></div></div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[1024px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {headers.map(h => <th key={h} className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {groupedData.length > 0 ? (
                                groupedData.map(([dept, group]) => {
                                    const isDeptExpanded = expandedDepts.has(dept);
                                    return (
                                        <React.Fragment key={dept}>
                                            <tr 
                                                className="bg-slate-100 dark:bg-dark-bg/60 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors"
                                                onClick={() => handleDeptToggle(dept)}
                                            >
                                                <td colSpan={headers.length + 1} className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <ChevronDownIcon 
                                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isDeptExpanded ? 'rotate-180' : ''}`} 
                                                            />
                                                            <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{dept}</span>
                                                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">({group.rows.length} {t('employees')})</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary flex gap-4">
                                                            <span>{`${t('totalLeaveDays')}: ${group.totalLeave.toFixed(2)}`}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isDeptExpanded && group.rows.map(row => {
                                                const isEmployeeExpanded = expandedEmployeeId === row.id;
                                                return (
                                                <React.Fragment key={row.id}>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer" onClick={() => handleEmployeeToggle(row.id)}>
                                                        <td className="p-4"><ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isEmployeeExpanded ? 'rotate-180' : ''}`} /></td>
                                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.id}</td>
                                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.name}</td>
                                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.position}</td>
                                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.department}</td>
                                                        <td className="p-4 text-sm font-bold text-brand-primary whitespace-nowrap text-right">{(row.leaveWithoutVacation || 0).toFixed(2)}</td>
                                                    </tr>
                                                    {isEmployeeExpanded && (
                                                        <tr className="bg-slate-200/50 dark:bg-dark-bg/50">
                                                            <td colSpan={headers.length + 1} className="p-0">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-light-bg dark:bg-dark-bg/50 p-6">
                                                                    <div>
                                                                        <h4 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">{t('monthlyData')}</h4>
                                                                        <div className="grid grid-cols-4 gap-3">
                                                                            {row.monthlyLeave.map((leave, index) => (
                                                                                <DetailItem key={index} label={monthNames[index]} value={leave.toFixed(2)} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">{t('leaveTypeVacation')}</h4>
                                                                        <div className="space-y-3">
                                                                            <DetailItem label={t('headerVacCarried')} value={row.vacationCarriedOver.toFixed(2)} />
                                                                            <DetailItem label={t('headerVacEntitled')} value={row.vacationEntitlement.toFixed(2)} />
                                                                            <DetailItem label={t('headerTotalVac')} value={row.totalVacation.toFixed(2)} />
                                                                            <DetailItem label={t('headerVacUsed')} value={row.vacationUsed.toFixed(2)} />
                                                                            <DetailItem label={t('headerVacAccrued')} value={row.vacationAccrued.toFixed(2)} />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                         <h4 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">{t('leaveTypeOther')}</h4>
                                                                        <div className="space-y-3">
                                                                            <DetailItem label={t('headerLeaveNoVac')} value={row.leaveWithoutVacation.toFixed(2)} />
                                                                            <DetailItem label={t('headerLeaveWithVac')} value={row.totalLeaveWithVacation.toFixed(2)} />
                                                                            <DetailItem label={t('headerSick')} value={row.sickLeave.toFixed(2)} />
                                                                            <DetailItem label={t('headerPersonal')} value={row.personalLeave.toFixed(2)} />
                                                                            <DetailItem label={t('headerBirthday')} value={row.birthdayLeave.toFixed(2)} />
                                                                            <DetailItem label={t('headerOther')} value={row.otherLeave.toFixed(2)} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )})}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={headers.length + 1} className="text-center p-8 text-light-text-secondary dark:text-dark-text-secondary">
                                        {t('noResultsFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedTopEmployee && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTopEmployee(null)}>
                    <div 
                        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-lg w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                    {t('leaveDetailsModalTitle')}
                                </h2>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                    {selectedTopEmployee.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTopEmployee(null)}
                                className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
                                aria-label={t('close')}
                            >
                                <XMarkIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                                {t('leaveSummaryNote')}
                            </p>
                            <div className="space-y-3">
                                {[
                                    { label: t('leaveTypeVacation'), value: selectedTopEmployee.vacationUsed },
                                    { label: t('leaveTypeSick'), value: selectedTopEmployee.sickLeave },
                                    { label: t('leaveTypePersonal'), value: selectedTopEmployee.personalLeave },
                                    { label: t('leaveTypeBirthday'), value: selectedTopEmployee.birthdayLeave },
                                    { label: t('leaveTypeOther'), value: selectedTopEmployee.otherLeave },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center bg-light-bg dark:bg-dark-bg p-3 rounded-md">
                                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{item.label}</span>
                                        <span className="font-bold text-brand-primary">{item.value.toFixed(2)} {t('days')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="p-6 border-t border-light-border dark:border-dark-border flex justify-end">
                            <button
                                onClick={() => setSelectedTopEmployee(null)}
                                className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors duration-300"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {selectedLeaveType && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLeaveType(null)}>
                    <div 
                        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
                            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                {`${selectedLeaveType}: ${t('leaveTypeDetailsModalTitle')}`}
                            </h2>
                            <button onClick={() => setSelectedLeaveType(null)} className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-light-card dark:bg-dark-card">
                                    <tr className="border-b border-light-border dark:border-dark-border">
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('department')}</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('days')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                    {leaveTypeDetails.map(detail => (
                                        <tr key={detail.department}>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{detail.department}</td>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{detail.days.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border flex justify-end">
                             <button
                                onClick={() => setSelectedLeaveType(null)}
                                className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors duration-300"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                 </div>
            )}
            {selectedDepartment && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDepartment(null)}>
                    <div 
                        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                    {t('departmentLeaveDetailsModalTitle')}
                                </h2>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                    {selectedDepartment}
                                </p>
                            </div>
                            <button onClick={() => setSelectedDepartment(null)} className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-light-card dark:bg-dark-card">
                                    <tr className="border-b border-light-border dark:border-dark-border">
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('leaveType')}</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('days')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                    {departmentLeaveDetails.map(detail => (
                                        <tr key={detail.leaveType}>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{detail.leaveType}</td>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{detail.days.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border flex justify-end">
                             <button
                                onClick={() => setSelectedDepartment(null)}
                                className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors duration-300"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default LeaveReport;
