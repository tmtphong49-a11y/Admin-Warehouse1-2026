import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ManpowerRow, ChartDataPoint, DepartmentComparison } from '../../types';
import KPICard from '../KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon } from '../icons';
import { parseValue } from '../../constants';

interface ManpowerReportProps {
    manpowerData: {
        tableData: ManpowerRow[];
        kpis: Kpi[];
        statusChartData: ChartDataPoint[];
        deptChartData: ChartDataPoint[];
        departmentComparisonData: DepartmentComparison[];
    };
    theme: 'light' | 'dark';
}

const ManpowerReport: React.FC<ManpowerReportProps> = ({ manpowerData, theme }) => {
    // FIX: Add default values to prevent crash when manpowerData is null, undefined, or an empty object.
    const { kpis = [], tableData = [], departmentComparisonData = [] } = manpowerData || {};
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('manpower'); // 'manpower', 'org_wh1'
    const [manpowerSearchTerm, setManpowerSearchTerm] = useState('');
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    const filteredManpowerData = useMemo(() => {
        if (!manpowerSearchTerm) return tableData;
        const lowercasedSearch = manpowerSearchTerm.toLowerCase();
        return tableData.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(lowercasedSearch)
            )
        );
    }, [tableData, manpowerSearchTerm]);

    const groupedManpowerData = useMemo(() => {
        const groups: { [key: string]: { rows: ManpowerRow[], totalManpower: number, totalCurrent: number } } = {};
        filteredManpowerData.forEach(row => {
            const dept = row.department || 'N/A';
            if (!groups[dept]) {
                groups[dept] = { rows: [], totalManpower: 0, totalCurrent: 0 };
            }
            groups[dept].rows.push(row);
            groups[dept].totalManpower += parseValue(row.manpower) || 0;
            groups[dept].totalCurrent += parseValue(row.current) || 0;
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredManpowerData]);

    useEffect(() => {
        if (manpowerSearchTerm !== '') {
            setExpandedDepts(new Set(groupedManpowerData.map(g => g[0])));
        } else if (groupedManpowerData.length > 0) {
            setExpandedDepts(new Set([groupedManpowerData[0][0]])); // Expand first group by default
        } else {
            setExpandedDepts(new Set());
        }
    }, [groupedManpowerData, manpowerSearchTerm]);

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

    const manpowerHeaders = useMemo(() => [
        t('headerNo'), t('headerEmp'), t('headerNameSurname'), t('headerPosition'), t('headerDept'), 'Grade', 'STATUS', 'MANPOWER', 'CURRENT'
    ], [t]);

    const comparisonChartData = useMemo(() => {
        if (!departmentComparisonData) return [];
        return [...departmentComparisonData]
            .sort((a, b) => (b.manpower + b.current) - (a.manpower + a.current)) // sort by total
            .slice(0, 15);
    }, [departmentComparisonData]);

    const neededStaffData = useMemo(() => {
        if (!departmentComparisonData) return [];
        return departmentComparisonData
            .filter(d => d.needed > 0)
            .sort((a, b) => b.needed - a.needed);
    }, [departmentComparisonData]);
    
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const CustomNeededStaffTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data: DepartmentComparison = payload[0].payload;
            
            return (
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 border border-light-border dark:border-dark-border rounded-lg shadow-lg max-w-sm">
                    <p className="label text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">{`${label}`}</p>
                    <p className="intro text-brand-secondary font-bold mb-2">{`${t('additionalManpowerNeeded')}: ${data.needed}`}</p>
                    {data.neededPositions && data.neededPositions.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary border-b border-light-border dark:border-dark-border pb-1 mb-2">{t('positionsNeeded' as any)}</h4>
                            <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                                {data.neededPositions.map(p => (
                                    <li key={p.position} className="flex justify-between">
                                        <span className="text-light-text-secondary dark:text-dark-text-secondary truncate pr-2" title={p.position}>{p.position}</span>
                                        <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{p.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderManpowerContent = () => {
        if (!tableData || tableData.length === 0) {
            return (
                <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                    <div className="text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                        <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageManpower')}</p>
                    </div>
                </div>
            );
        }
        return (
             <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi, index) => (
                        <KPICard key={index} {...kpi} title={t(kpi.title as any)} />
                    ))}
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('manpowerVsCurrentByDept' as any)}</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart layout="vertical" data={comparisonChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                                <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor }} />
                                <YAxis type="category" dataKey="department" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} width={120} interval={0} />
                                <Tooltip
                                    cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                    contentStyle={{
                                        backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                        borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="manpower" name={t('manpowerTotal' as any)} stackId="a" fill="#10B981" />
                                <Bar dataKey="current" name={t('currentTotal' as any)} stackId="a" fill="#6366F1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('neededStaffByDepartment' as any)}</h3>
                        <ResponsiveContainer width="100%" height="90%">
                             <BarChart layout="vertical" data={neededStaffData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                                <XAxis type="number" allowDecimals={false} stroke={tickColor} tick={{ fill: tickColor }} />
                                <YAxis type="category" dataKey="department" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} width={120} interval={0} />
                                <Tooltip
                                    cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                    content={<CustomNeededStaffTooltip />}
                                />
                                <Bar dataKey="needed" name={t('additionalManpowerNeeded')} fill="#EC4899">
                                    <LabelList dataKey="needed" position="right" style={{ fill: tickColor, fontSize: 12 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                    <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('employeeDetails')}</h3>
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                            <input
                                type="text"
                                placeholder={t('searchEmployees')}
                                value={manpowerSearchTerm}
                                onChange={(e) => setManpowerSearchTerm(e.target.value)}
                                className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
                            />
                        </div>
                    </div>
                    <div className="overflow-auto max-h-[600px]">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                                <tr className="border-b border-light-border dark:border-dark-border">
                                    {manpowerHeaders.map(h => <th key={h} className="p-4 text-sm font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                                {groupedManpowerData.length > 0 ? (
                                    groupedManpowerData.map(([dept, group]) => {
                                        const isDeptExpanded = expandedDepts.has(dept);
                                        return (
                                            <React.Fragment key={dept}>
                                                <tr 
                                                    className="bg-slate-100 dark:bg-dark-bg/60 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors"
                                                    onClick={() => handleDeptToggle(dept)}
                                                >
                                                    <td colSpan={manpowerHeaders.length} className="p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-3">
                                                                <ChevronDownIcon 
                                                                    className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isDeptExpanded ? 'rotate-180' : ''}`} 
                                                                />
                                                                <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{dept}</span>
                                                                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">({group.rows.length} {t('employees')})</span>
                                                            </div>
                                                            <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary flex gap-4">
                                                                <span>{`Manpower: ${group.totalManpower}`}</span>
                                                                <span>{`Current: ${group.totalCurrent}`}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isDeptExpanded && group.rows.map(row => (
                                                    <tr key={row.employeeId} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.id}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.employeeId}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.name}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.position}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.department}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.grade}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.status}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.manpower}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.current}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={manpowerHeaders.length} className="text-center p-8 text-light-text-secondary dark:text-dark-text-secondary">
                                            {t('noResultsFound')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8">
            {renderManpowerContent()}
        </div>
    );
};
// FIX: Add default export for the ManpowerReport component to be used in App.tsx.
export default ManpowerReport;