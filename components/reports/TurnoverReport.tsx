
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { TurnoverRow } from '../../types';
import KPICard from '../KPICard';
import { DocumentTextIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon } from '../icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TurnoverReportProps {
    turnoverData: {
        tableData: TurnoverRow[];
    };
    manpowerData: any; // Keep for prop signature consistency, but unused
    theme: 'light' | 'dark';
}

interface TurnoverStats {
    totalResignations: number;
    avgTenure: number;
    topReason: string;
    topDept: string;
    donutChartData: { name: string; value: number }[];
    totalEmployees: number;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
        <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{label}</span>
        <span className="text-light-text-primary dark:text-dark-text-primary mt-1 block break-words">{value || '-'}</span>
    </div>
);

const TurnoverReport: React.FC<TurnoverReportProps> = ({ turnoverData, theme }) => {
    const { tableData } = turnoverData || { tableData: [] };
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState<TurnoverRow | null>(null);
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    const stats = useMemo((): TurnoverStats | null => {
        if (!tableData || tableData.length === 0) return null;

        const hires = tableData.filter(r => {
            if (r.status === 'ทำงาน' && r.hireDate) {
                const dateParts = r.hireDate.split('/');
                if (dateParts.length === 3) {
                    const year = parseInt(dateParts[2], 10);
                    return year === 2025;
                }
            }
            return false;
        });
        const resignations = tableData.filter(r => r.status === 'ลาออก');

        const totalHires = hires.length;
        const totalResignations = resignations.length;

        const totalTenure = resignations.reduce((acc, r) => acc + (r.tenureYears || 0), 0);
        const avgTenure = totalResignations > 0 ? (totalTenure / totalResignations) : 0;

        const reasonCounts = resignations.reduce((acc, r) => {
            const reason = (r.reasonForLeaving || 'Unknown').trim();
            if (reason !== '') {
                acc[reason] = (acc[reason] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const topReason = Object.entries(reasonCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0] || ['N/A', 0];

        const deptCounts = resignations.reduce((acc, r) => {
            const dept = (r.department || 'Unknown').trim();
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const topDept = Object.entries(deptCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1])[0] || ['N/A', 0];

        const donutChartData = [
            { name: t('legendNewHires2025' as any), value: totalHires },
            { name: t('legendResignations' as any), value: totalResignations },
        ];
        
        const totalEmployees = tableData.filter(r => r.status === 'ทำงาน').length;

        return {
            totalResignations,
            avgTenure,
            topReason: topReason[0],
            topDept: topDept[0],
            donutChartData,
            totalEmployees: totalEmployees,
        };
    }, [tableData, t]);

    const kpiCardsData = useMemo(() => {
        if (!stats) return [];

        const previousYear = {
            totalTurnover: 32,
            avgTenure: 3.12,
        };

        const turnoverDiff = stats.totalResignations - previousYear.totalTurnover;
        const turnoverPct = previousYear.totalTurnover > 0 ? (turnoverDiff / previousYear.totalTurnover) * 100 : (stats.totalResignations > 0 ? 100 : 0);
        const turnoverComparison = {
            value: turnoverDiff.toLocaleString('en-US', { signDisplay: 'always' }),
            percentage: `${turnoverPct.toFixed(1)}%`,
            period: 'year' as const,
            previousValue: previousYear.totalTurnover.toString(),
        };
        // Higher turnover is bad, so an increase is a 'down' trend
        const turnoverTrendDirection = turnoverDiff > 0 ? 'down' : 'up';

        const tenureDiff = stats.avgTenure - previousYear.avgTenure;
        const tenurePct = previousYear.avgTenure > 0 ? (tenureDiff / previousYear.avgTenure) * 100 : (stats.avgTenure > 0 ? 100 : 0);
        const tenureComparison = {
            value: tenureDiff.toLocaleString('en-US', { signDisplay: 'always', minimumFractionDigits: 2 }),
            percentage: `${tenurePct.toFixed(1)}%`,
            period: 'year' as const,
            previousValue: previousYear.avgTenure.toFixed(2),
        };
        // Higher tenure is good, so an increase is an 'up' trend
        const tenureTrendDirection = tenureDiff > 0 ? 'up' : 'down';

        return [
            { title: 'totalTurnover', value: stats.totalResignations.toString(), icon: "UsersIcon", color: "text-brand-danger", comparison: turnoverComparison, trendDirection: turnoverTrendDirection },
            { title: 'avgTenure', value: stats.avgTenure.toFixed(2), subValue: t('year'), icon: "ClockIcon", color: "text-brand-primary", comparison: tenureComparison, trendDirection: tenureTrendDirection },
            { title: 'topReasonForLeaving', value: stats.topReason, icon: "QuestionMarkCircleIcon", color: "text-brand-warning" },
            { title: 'topDeptByTurnover', value: stats.topDept, icon: "BuildingOfficeIcon", color: "text-brand-secondary" },
        ];
    }, [stats, t]);


    const monthlyStats = useMemo(() => {
        const hiresByMonth = Array(12).fill(0);
        const resignationsByMonth = Array(12).fill(0);

        const parseDate = (dateStr: string): Date | null => {
            if (!dateStr || typeof dateStr !== 'string') return null;
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2], 10);
            if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900 || month < 0 || month > 11 || day < 1 || day > 31) {
                return null;
            }
            return new Date(year, month, day);
        };

        (tableData || []).forEach(row => {
            if (row.status === 'ทำงาน' && row.hireDate) {
                const date = parseDate(row.hireDate);
                if (date && date.getFullYear() === 2025) {
                    const month = date.getMonth();
                    hiresByMonth[month]++;
                }
            }
            if (row.status === 'ลาออก' && row.terminationDate) {
                const date = parseDate(row.terminationDate);
                if (date) {
                    const month = date.getMonth();
                    resignationsByMonth[month]++;
                }
            }
        });
        
        const monthNames = [t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'), t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')];

        return monthNames.map((name, index) => ({
            name,
            newHires: hiresByMonth[index],
            resignations: resignationsByMonth[index],
        }));
    }, [tableData, t]);

    const departmentStats = useMemo(() => {
        if (!tableData) return [];
        const stats: { [key: string]: { name: string; newHires: number; resignations: number } } = {};
        
        const parseDate = (dateStr: string): Date | null => {
            if (!dateStr || typeof dateStr !== 'string') return null;
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; 
            const year = parseInt(parts[2], 10);
            if (isNaN(year)) return null;
            return new Date(year, month, day);
        };

        tableData.forEach(row => {
            const dept = row.department || 'Unknown';
            if (!stats[dept]) {
                stats[dept] = { name: dept, newHires: 0, resignations: 0 };
            }
            if (row.status === 'ทำงาน' && row.hireDate) {
                const date = parseDate(row.hireDate);
                if (date && date.getFullYear() === 2025) {
                    stats[dept].newHires++;
                }
            } else if (row.status === 'ลาออก') {
                stats[dept].resignations++;
            }
        });
        return Object.values(stats).sort((a, b) => (b.newHires + b.resignations) - (a.newHires + a.resignations));
    }, [tableData]);

    const filteredData = useMemo(() => {
        if (!tableData) return [];
        const lowercasedSearch = searchTerm.toLowerCase();
        if (!lowercasedSearch) return tableData;
        return tableData.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(lowercasedSearch)
            )
        );
    }, [tableData, searchTerm]);

    const groupedData = useMemo(() => {
        const groups: { [key: string]: { rows: TurnoverRow[] } } = {};
        filteredData.forEach(row => {
            const dept = row.department || 'Unknown';
            if (!groups[dept]) {
                groups[dept] = { rows: [] };
            }
            groups[dept].rows.push(row);
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
    };
    
    const visibleHeaders = [
        t('headerNo' as any), t('headerEmp' as any), t('headerNameSurname' as any), t('headerPosition' as any),
        'Grade', 'วันเริ่มงาน (พ.ศ.)', t('tenure'), 'ทำงานวันสุดท้าย', 'สาเหตุการลาออก', t('headerStatus')
    ];

    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    if (!tableData || tableData.length === 0 || !stats) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">Please upload the Employee In-Out Excel file to view the report.</p>
                </div>
            </div>
        );
    }
    
    const COLORS = ['#10B981', '#EF4444'];
    
    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {kpiCardsData.map(kpiProps => (
                    <KPICard
                        key={kpiProps.title}
                        title={t(kpiProps.title as any)}
                        value={kpiProps.value as string}
                        subValue={kpiProps.subValue}
                        icon={kpiProps.icon as string}
                        color={kpiProps.color as string}
                        comparison={kpiProps.comparison}
                        trendDirection={kpiProps.trendDirection as 'up' | 'down' | 'neutral'}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[400px] shadow-lg flex flex-col">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('turnoverStatusBreakdown' as any)}</h3>
                     <div className="relative flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.donutChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={5}>
                                    {stats.donutChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend iconSize={10} wrapperStyle={{ bottom: 0 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">{stats.totalEmployees}</span>
                            <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('employees')}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[400px] shadow-lg">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('monthlyTurnover' as any)}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={monthlyStats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis dataKey="name" stroke={tickColor} tick={{ fill: tickColor }} />
                            <YAxis stroke={tickColor} tick={{ fill: tickColor }} allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="newHires" name={t('legendNewHires' as any)} fill="#10B981" />
                            <Bar dataKey="resignations" name={t('legendResignations' as any)} fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('turnoverByDepartmentChart' as any)}</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={departmentStats} margin={{ top: 5, right: 20, left: -10, bottom: 90 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                        <XAxis dataKey="name" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} angle={-45} textAnchor="end" interval={0} height={100} />
                        <YAxis stroke={tickColor} tick={{ fill: tickColor }} allowDecimals={false} />
                        <Tooltip
                            cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                        <Bar dataKey="newHires" name={t('legendNewHires' as any)} fill="#10B981" />
                        <Bar dataKey="resignations" name={t('legendResignations' as any)} fill="#EF4444" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('employeeDetails')}</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            placeholder={t('search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[1200px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {visibleHeaders.map(h => <th key={h} className="p-4 text-sm font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                             {groupedData.length > 0 ? (
                                groupedData.map(([dept, group]) => {
                                    const isDeptExpanded = expandedDepts.has(dept);
                                    return (
                                        <React.Fragment key={dept}>
                                            <tr 
                                                className="bg-slate-100 dark:bg-dark-bg/60 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors"
                                                onClick={() => handleDeptToggle(dept)}
                                            >
                                                <td colSpan={visibleHeaders.length + 2} className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <ChevronDownIcon 
                                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isDeptExpanded ? 'rotate-180' : ''}`} 
                                                            />
                                                            <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{dept}</span>
                                                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">({group.rows.length} {t('employees')})</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isDeptExpanded && group.rows.map((row, index) => (
                                                <tr key={row.employeeId || index} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 cursor-pointer" onClick={() => setSelectedRow(row)}>
                                                    <td className="p-4"></td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.id}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.employeeId}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.name}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.position}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.grade}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.hireDateBuddhist}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{`${row.tenureYears} Y, ${row.tenureMonths} M, ${row.tenureDays} D`}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.terminationDate}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">{row.reasonForLeaving}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            row.status === 'ทำงาน' 
                                                            ? 'bg-green-500/20 text-green-400' 
                                                            : row.status === 'ลาออก' 
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'bg-slate-500/20 text-slate-400'
                                                        }`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={visibleHeaders.length + 1} className="text-center p-8 text-light-text-secondary dark:text-dark-text-secondary">{t('noResultsFound')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRow && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRow(null)}>
                    <div 
                        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('employeeDetailsModalTitle' as any)}</h2>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">{selectedRow.name} ({selectedRow.employeeId})</p>
                            </div>
                            <button onClick={() => setSelectedRow(null)} className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('personalInfo' as any)}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <DetailItem label={t('nickname' as any)} value={selectedRow.nickname} />
                                    <DetailItem label={t('dob' as any)} value={selectedRow.dob} />
                                    <DetailItem label={t('age' as any)} value={selectedRow.age} />
                                    <DetailItem label={t('religion' as any)} value={selectedRow.religion} />
                                    <DetailItem label={t('hometown' as any)} value={selectedRow.hometown} />
                                    <DetailItem label={t('mobile' as any)} value={selectedRow.mobile} />
                                    <DetailItem label={t('education' as any)} value={selectedRow.education} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('employmentInfo' as any)}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <DetailItem label={t('headerPosition')} value={selectedRow.position} />
                                    <DetailItem label={t('headerDept')} value={selectedRow.department} />
                                    <DetailItem label="Grade" value={selectedRow.grade} />
                                    <DetailItem label={t('headerStatus')} value={selectedRow.status} />
                                    <DetailItem label={t('employmentType' as any)} value={selectedRow.employmentType} />
                                    <DetailItem label={t('headerCostCenter')} value={selectedRow.costCenter} />
                                    <DetailItem label={t('hireDateBuddhist' as any)} value={selectedRow.hireDateBuddhist} />
                                    <DetailItem label={t('hireDateChristian' as any)} value={selectedRow.hireDate} />
                                    <DetailItem label={t('probationPassDate' as any)} value={selectedRow.probationPassDate} />
                                    <DetailItem label={t('tenureYears' as any)} value={selectedRow.tenureYears} />
                                    <DetailItem label={t('tenureMonths' as any)} value={selectedRow.tenureMonths} />
                                    <DetailItem label={t('tenureDays' as any)} value={selectedRow.tenureDays} />
                                </div>
                            </div>
                             {selectedRow.status === 'ลาออก' && (
                                <div>
                                    <h3 className="text-lg font-semibold text-red-500 dark:text-red-400 mb-3">{t('terminationInfo' as any)}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <DetailItem label={t('headerTerminationDate')} value={selectedRow.terminationDate} />
                                        <DetailItem label={t('effectiveDate' as any)} value={selectedRow.effectiveDate} />
                                        <div className="md:col-span-3">
                                            <DetailItem label={t('reasonForLeaving' as any)} value={selectedRow.reasonForLeaving} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border flex justify-end">
                             <button
                                onClick={() => setSelectedRow(null)}
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

export default TurnoverReport;
