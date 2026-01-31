
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, OtRow, OtAverageRow } from '../../types';
import KPICard from '../KPICard';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon, CurrencyDollarIcon } from '../icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface OTReportProps {
    tableData: OtRow[];
    kpis: Kpi[];
    chartData: ChartDataPoint[];
    otAveragesByDept: OtAverageRow[];
    theme: 'light' | 'dark';
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{label}</span>
        <span className="text-light-text-primary dark:text-dark-text-primary mt-1">{value || '-'}</span>
    </div>
);


const OTReport: React.FC<OTReportProps> = ({ tableData, kpis, chartData, otAveragesByDept, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    const handleRowToggle = (rowId: string) => {
        setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
    };

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
        setExpandedRowId(null); // Collapse employee row when department is toggled
    };
    
    const monthNames = useMemo(() => [
        t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'),
        t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')
    ], [t]);
    
    const headers = useMemo(() => [
        t('headerName'), t('headerPosition'), t('headerDepartment'), t('headerTotal')
    ], [t]);

    const filteredData = useMemo(() => tableData.filter(row => {
        const searchString = searchTerm.toLowerCase();
        return (
            row.id.toLowerCase().includes(searchString) ||
            row.employeeId.toLowerCase().includes(searchString) ||
            row.name.toLowerCase().includes(searchString) ||
            row.position.toLowerCase().includes(searchString) ||
            row.department.toLowerCase().includes(searchString) ||
            row.grade.toLowerCase().includes(searchString) ||
            row.status.toLowerCase().includes(searchString) ||
            String(row.totalOT).toLowerCase().includes(searchString)
        );
    }), [tableData, searchTerm]);

    const groupedByDepartment = useMemo(() => {
        const groups: { [key: string]: { rows: OtRow[], subtotal: number } } = {};
        filteredData.forEach(row => {
            const key = row.department && row.department.trim() !== '' ? row.department : 'OTHER';
            if (!groups[key]) {
                groups[key] = { rows: [], subtotal: 0 };
            }
            groups[key].rows.push(row);
            groups[key].subtotal += row.totalOT;
        });
        return Object.entries(groups).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    }, [filteredData]);
    
    useEffect(() => {
        if (searchTerm) {
            setExpandedDepts(new Set(groupedByDepartment.map(g => g[0])));
        } else if (groupedByDepartment.length > 0) {
            setExpandedDepts(new Set([groupedByDepartment[0][0]]));
        } else {
            setExpandedDepts(new Set());
        }
    }, [groupedByDepartment, searchTerm]);

    const topEmployees = useMemo(() => {
        if (!tableData) return [];
        return [...tableData]
            .sort((a, b) => b.totalOT - a.totalOT)
            .slice(0, 10);
    }, [tableData]);

    const topDepartments = useMemo(() => {
        if (!tableData) return [];
        const departmentTotals: { [key: string]: { totalHours: number; totalPay: number } } = {};
        tableData.forEach(row => {
            const dept = row.department || 'Unknown';
            if (!departmentTotals[dept]) {
                departmentTotals[dept] = { totalHours: 0, totalPay: 0 };
            }
            departmentTotals[dept].totalHours += row.totalOT;
            departmentTotals[dept].totalPay += row.totalOTPay;
        });
        return Object.entries(departmentTotals)
            .map(([name, totals]) => ({ name, ...totals }))
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 10);
    }, [tableData]);

    const sortedAveragesData = useMemo(() => {
        return [...(otAveragesByDept || [])].sort((a, b) => a.department.localeCompare(b.department));
    }, [otAveragesByDept]);
    
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                    <p className="label text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">{`${label}`}</p>
                    {payload.map((pld: any) => (
                        <div key={pld.dataKey} style={{ color: pld.fill }}>
                            {`${pld.name}: ${
                                pld.dataKey === 'OT Pay' 
                                ? `฿${Number(pld.value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                                : `${Number(pld.value).toFixed(2)}`
                            }`}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const DepartmentTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                    <p className="label text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">{label}</p>
                    <p style={{ color: '#EC4899' }}>{`${t('totalHours')}: ${data.totalHours.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                    <p style={{ color: '#10B981' }}>{`${t('totalOtPay')}: ฿${data.totalPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                </div>
            );
        }
        return null;
    };

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageOT')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => <KPICard key={index} {...kpi} title={t(kpi.title as any)} />)}
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('monthlyOvertimeHoursAndPay')}</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                        <XAxis dataKey="name" stroke={tickColor} tick={{ fill: tickColor }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#6366F1" tick={{ fill: "#6366F1" }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10B981" tick={{ fill: "#10B981" }} tickFormatter={(value) => `฿${new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value as number)}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: tickColor }} />
                        <Bar yAxisId="left" dataKey="OT Hours" fill="#6366F1" name={t('totalOtHours')} />
                        <Bar yAxisId="right" dataKey="OT Pay" fill="#10B981" name={t('totalOtPay')} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Top Employees Chart */}
                 <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col p-6 h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('top10EmployeesByOT')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={topEmployees}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} />
                            <YAxis
                                type="category" dataKey="name" stroke={tickColor}
                                tick={{ fill: tickColor, fontSize: 12 }}
                                width={120} interval={0}
                                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                                formatter={(value: number) => value.toFixed(2)}
                            />
                            <Bar dataKey="totalOT" name={t('totalHours')} fill="#8B5CF6">
                                <LabelList dataKey="totalOT" position="right" style={{ fill: tickColor, fontSize: 12 }} formatter={(value: number) => value.toFixed(2)} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Departments Chart */}
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col p-6 h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('top10DepartmentsByOT')}</h3>
                     <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            layout="vertical"
                            data={topDepartments}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} />
                            <YAxis
                                type="category" dataKey="name" stroke={tickColor}
                                tick={{ fill: tickColor, fontSize: 12 }}
                                width={120} interval={0}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                content={<DepartmentTooltip />}
                            />
                            <Bar dataKey="totalHours" name={t('totalHours')} fill="#EC4899">
                                <LabelList dataKey="totalHours" position="right" style={{ fill: tickColor, fontSize: 12 }} formatter={(value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col p-6">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('averageOtReport' as any)}</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sortedAveragesData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis dataKey="department" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} />
                            <YAxis stroke={tickColor} tick={{ fill: tickColor }} />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                                formatter={(value: number) => value.toFixed(2)}
                            />
                            <Legend />
                            <Bar dataKey="avgOtHoursPerMonth" name={t('headerAvgOtMonth' as any)} fill="#F59E0B" />
                            <Bar dataKey="avgOtHoursPerWeek" name={t('headerAvgOtWeek' as any)} fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-dark-bg text-xs uppercase text-light-text-secondary dark:text-dark-text-secondary">
                            <tr>
                                <th className="p-2 font-semibold tracking-wider">Department</th>
                                <th className="p-2 font-semibold tracking-wider text-right">{t('headerEmployeeCount' as any)}</th>
                                <th className="p-2 font-semibold tracking-wider text-right">{t('headerTotalOtHours' as any)}</th>
                                <th className="p-2 font-semibold tracking-wider text-right">{t('headerAvgOtMonth' as any)}</th>
                                <th className="p-2 font-semibold tracking-wider text-right">{t('headerAvgOtWeek' as any)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border">
                            {sortedAveragesData.map(item => (
                                <tr key={item.department} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                    <td className="p-2 font-medium text-light-text-primary dark:text-dark-text-primary">{item.department}</td>
                                    <td className="p-2 text-right">{item.employeeCount}</td>
                                    <td className="p-2 text-right">{item.totalOtHours.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-2 text-right">{item.avgOtHoursPerMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-2 text-right">{item.avgOtHoursPerWeek.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('employeeOTDetails')}</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            placeholder={t('searchEmployees')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[1024px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {headers.map(header => (
                                    <th key={header} className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase whitespace-nowrap">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                            {groupedByDepartment.map(([dept, group]) => {
                                const isDeptExpanded = expandedDepts.has(dept);
                                return (
                                <React.Fragment key={dept}>
                                    <tr 
                                        className="bg-slate-50/60 dark:bg-dark-bg/50 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors"
                                        onClick={() => handleDeptToggle(dept)}
                                    >
                                        <td colSpan={headers.length + 1} className="p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <ChevronDownIcon 
                                                        className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isDeptExpanded ? 'rotate-180' : ''}`} 
                                                    />
                                                    <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{dept}</span>
                                                </div>
                                                <span className="text-sm font-semibold text-brand-primary">{group.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {isDeptExpanded && group.rows.map((row) => {
                                        const isExpanded = expandedRowId === row.id;
                                        return (
                                        <React.Fragment key={row.id}>
                                            <tr onClick={() => handleRowToggle(row.id)} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer">
                                                <td className="p-4">
                                                    <ChevronDownIcon 
                                                        className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isExpanded ? 'rotate-180' : ''}`} 
                                                    />
                                                </td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.name}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.position}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.department}</td>
                                                <td className="p-4 text-sm font-bold text-brand-primary whitespace-nowrap text-right">{row.totalOT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-200/50 dark:bg-dark-bg/50">
                                                    <td colSpan={headers.length + 1} className="p-0">
                                                        <div className="bg-light-bg dark:bg-dark-bg/50 p-6">
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 mb-6">
                                                                <DetailItem label={t('headerEmployeeId')} value={row.employeeId} />
                                                                <DetailItem label={t('headerGrade')} value={row.grade} />
                                                                <DetailItem label={t('headerStatus')} value={row.status} />
                                                                <DetailItem label={t('year')} value={row.year} />
                                                                <DetailItem label={t('otRate')} value={row.otRate > 0 ? `฿${row.otRate.toFixed(2)}` : '-'} />
                                                                <DetailItem label={t('totalOtPay')} value={`฿${row.totalOTPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                            </div>
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                <div>
                                                                    <h4 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">{t('monthlyOvertimeHours')}</h4>
                                                                    <div className="grid grid-cols-4 gap-3">
                                                                        {row.monthlyOT.map((ot, index) => (
                                                                            <DetailItem key={index} label={monthNames[index]} value={ot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">{t('monthlyOvertimePay')}</h4>
                                                                    <div className="grid grid-cols-4 gap-3">
                                                                        {row.monthlyOTPay.map((pay, index) => (
                                                                            <DetailItem key={index} label={monthNames[index]} value={`฿${pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                        );
                                    })}
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OTReport;