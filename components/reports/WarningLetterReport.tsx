import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, WarningLetterRow } from '../../types';
import KPICard from '../KPICard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList } from 'recharts';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon } from '../icons';

interface WarningLetterReportProps {
    tableData: WarningLetterRow[];
    kpis: Kpi[];
    byDeptChartData: ChartDataPoint[];
    byTypeChartData: ChartDataPoint[];
    damageByDeptChartData: ChartDataPoint[];
    theme: 'light' | 'dark';
}

const WarningLetterReport: React.FC<WarningLetterReportProps> = ({ tableData, kpis, byDeptChartData, byTypeChartData, damageByDeptChartData, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [componentOrder, setComponentOrder] = useState<string[]>(['warningsByDept', 'damageByDepartment']);
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.currentTarget.classList.add('opacity-50', 'border-2', 'border-dashed', 'border-brand-primary');
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newOrder = [...componentOrder];
            const dragItemContent = newOrder.splice(dragItem.current, 1)[0];
            if (dragItemContent) {
                newOrder.splice(dragOverItem.current, 0, dragItemContent);
            }
            dragItem.current = null;
            dragOverItem.current = null;
            setComponentOrder(newOrder);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50', 'border-2', 'border-dashed', 'border-brand-primary');
    };

    const totalDamageValue = useMemo(() => {
        return tableData.reduce((sum, row) => sum + (row.damageValue || 0), 0);
    }, [tableData]);

    const filteredData = useMemo(() => {
        if (!searchTerm) return tableData;
        const lowercasedSearch = searchTerm.toLowerCase();
        return tableData.filter(row => {
            // Search only in relevant, visible fields to avoid incorrect matches
            return (
                String(row.employeeName).toLowerCase().includes(lowercasedSearch) ||
                String(row.employeeId).toLowerCase().includes(lowercasedSearch) ||
                String(row.department).toLowerCase().includes(lowercasedSearch) ||
                String(row.reason).toLowerCase().includes(lowercasedSearch) ||
                String(row.warningId).toLowerCase().includes(lowercasedSearch) ||
                String(row.type).toLowerCase().includes(lowercasedSearch) ||
                String(row.id).toLowerCase().includes(lowercasedSearch)
            );
        });
    }, [tableData, searchTerm]);
    
    const groupedData = useMemo(() => {
        const groups: { [key: string]: { rows: WarningLetterRow[], totalWarnings: number, totalDamage: number } } = {};
        filteredData.forEach(row => {
            const dept = row.department || 'Unknown';
            if (!groups[dept]) {
                groups[dept] = { rows: [], totalWarnings: 0, totalDamage: 0 };
            }
            groups[dept].rows.push(row);
            groups[dept].totalWarnings++;
            groups[dept].totalDamage += row.damageValue || 0;
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

    const headers = useMemo(() => {
        return [
            'ลำดับ', 'วันที่เกิดเหตุ', 'รหัสพนักงาน', 'ผู้ได้รับใบเตือน', 'ส่วนงาน', 
            'เหตุการณ์', 'รหัสใบเตือน', 'มูลค่าความเสียหาย', 'ประเภทใบเตือน', 
            'วันที่ส่งใบเตือนให้ HR', 'วันที่ HR ลงมาสอสวน', 'วันที่ได้รับหนังสือเตือนHR', 'สถานะเอกสาร'
        ];
    }, []);

    const componentMap = useMemo(() => {
        const map: { [key: string]: { component: React.ReactNode; className: string } } = {};

        map['warningsByDept'] = {
            component: (
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('warningsByDepartment')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            data={byDeptChartData}
                            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B', fontSize: 12 }} />
                            <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B' }} />
                            <Tooltip 
                                cursor={{ fill: theme === 'dark' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(203, 213, 225, 0.2)' }}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                            />
                            <Legend wrapperStyle={{ color: theme === 'dark' ? '#94A3B8' : '#64748B' }} />
                            <Bar name={t('verbalWarnings')} dataKey="verbal" stackId="a" fill="#F59E0B">
                                <LabelList dataKey="verbal" position="center" formatter={(value: number) => value > 0 ? value : ''} fill="#ffffff" fontWeight="bold"/>
                            </Bar>
                            <Bar name={t('writtenWarnings')} dataKey="written" stackId="a" fill="#EC4899">
                                <LabelList dataKey="written" position="center" formatter={(value: number) => value > 0 ? value : ''} fill="#ffffff" fontWeight="bold"/>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ),
            className: "lg:col-span-1"
        };

        map['damageByDepartment'] = {
            component: (
                 <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('damageByDepartment')}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            data={damageByDeptChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B', fontSize: 12 }} angle={-45} textAnchor="end" interval={0} height={60} />
                            <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#64748B' }} tickFormatter={(value) => `฿${new Intl.NumberFormat('th-TH', { notation: 'compact', maximumFractionDigits: 0 }).format(Number(value))}`} />
                            <Tooltip 
                                formatter={(value: number) => `฿${value.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                    borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                                }}
                            />
                            <Bar dataKey="value" name={t('headerDamageValue')} fill="#EF4444">
                                <LabelList dataKey="value" position="top" formatter={(value: number) => value > 0 ? `฿${value.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`: ''} style={{ fill: theme === 'dark' ? '#F8FAFC' : '#0F172A', fontSize: 12 }}/>
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ),
            className: "lg:col-span-1"
        };
        return map;
    }, [t, theme, byDeptChartData, damageByDeptChartData]);


    if (!tableData || tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageWarningLetter' as any)}</p>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {componentOrder.map((componentId, index) => {
                    const item = componentMap[componentId];
                    if (!item) return null;

                    return (
                        <div
                            key={componentId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            className={`${item.className} cursor-grab active:cursor-grabbing transition-shadow duration-300`}
                        >
                            {item.component}
                        </div>
                    );
                })}
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Warning Letter Details</h3>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('totalDamage')}</p>
                             <p className="text-lg font-bold text-brand-primary">
                                 {`฿${totalDamageValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
                             </p>
                        </div>
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
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[1800px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {headers.map(h => <th key={h} className="p-4 text-sm font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{h}</th>)}
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
                                                <td colSpan={headers.length + 1} className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <ChevronDownIcon 
                                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isDeptExpanded ? 'rotate-180' : ''}`} 
                                                            />
                                                            <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{dept}</span>
                                                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">({group.rows.length} {group.rows.length === 1 ? t('case') : t('cases')})</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary flex gap-4">
                                                            <span>{`${t('totalDamage')}: ฿${group.totalDamage.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isDeptExpanded && group.rows.map((row, index) => (
                                                <tr key={`${row.id}-${row.employeeId}-${index}`} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                                    <td className="p-4"></td> {/* Placeholder for expander icon alignment */}
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.id}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.date}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.employeeId}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.employeeName}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.department}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-normal">{row.reason}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.warningId}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right">{row.damageValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.type}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.hrSentDate}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.hrInvestigationDate}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.hrWarningReceivedDate}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.documentStatus}</td>
                                                </tr>
                                            ))}
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
        </div>
    );
};

export default WarningLetterReport;