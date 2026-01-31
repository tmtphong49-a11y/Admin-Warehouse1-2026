
import React, { useMemo, useState, useRef, useEffect } from 'react';
// FIX: Import 'ResponsiveContainer' and 'Tooltip' from 'recharts' to resolve 'Cannot find name' errors.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, ConsumableRow } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon, XMarkIcon } from '../icons';
import { parseValue } from '../../constants';

interface ConsumablesReportProps {
    tableData: ConsumableRow[];
    kpis: Kpi[];
    chartData: ChartDataPoint[];
    topItems: { name: string; frequency: number; totalCost: number; material: string; }[];
    theme: 'light' | 'dark';
}

const ConsumablesReport: React.FC<ConsumablesReportProps> = ({ tableData, kpis, chartData, topItems, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [componentOrder, setComponentOrder] = useState<string[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
    const [selectedTopItem, setSelectedTopItem] = useState<{ name: string; material: string } | null>(null);
    const [topItemDetails, setTopItemDetails] = useState<{ department: string; totalCost: number }[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    useEffect(() => {
        const initialKpiIds = kpis.map((_, index) => `kpi-${index}`);
        const initialWidgetIds = ['monthlyCost', 'costByDept', 'topItems'];
        
        const currentKpiIds = componentOrder.filter(id => id.startsWith('kpi-'));
        if (componentOrder.length === 0 || currentKpiIds.length !== kpis.length) {
          setComponentOrder([...initialKpiIds, ...initialWidgetIds]);
        }
    }, [kpis, componentOrder]);

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

    const handleTopItemClick = (item: { name: string; material: string }) => {
        const detailsByDept: { [key: string]: number } = {};
        
        tableData
            .filter(row => row.material === item.material)
            .forEach(row => {
                const dept = row.department || 'Unknown';
                detailsByDept[dept] = (detailsByDept[dept] || 0) + (parseValue(row.totalPrice) || 0);
            });
            
        const sortedDetails = Object.entries(detailsByDept)
            .map(([department, totalCost]) => ({ department, totalCost }))
            .sort((a, b) => b.totalCost - a.totalCost);

        setTopItemDetails(sortedDetails);
        setSelectedTopItem(item);
    };

    const headers = useMemo(() => [
        t('headerDate'), t('headerMaterial'), t('headerDescription'), t('headerQuantity'), t('headerUnit'), 
        t('headerPrice'), t('headerTotalPrice'), t('headerCostCenter'), t('headerDepartment')
    ], [t]);
    
    const numericHeaders = useMemo(() => [t('headerQuantity'), t('headerPrice'), t('headerTotalPrice')], [t]);
    
    const columnOrder: (keyof ConsumableRow)[] = useMemo(() => [
        'date', 'material', 'description', 'quantity', 'unit', 'price', 'totalPrice', 'costCenter', 'department'
    ], []);

    const formatMonthForDisplay = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };
    
    const groupedData = useMemo(() => {
        let data = tableData;
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            data = data.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(lowercasedSearch)
                )
            );
        }

        const groups: { [key: string]: { rows: ConsumableRow[], totalCost: number, totalItems: number } } = {};

        data.forEach(row => {
            const parts = row.date.split('/');
            if (parts.length === 3) {
                const year = parts[2];
                const month = parts[1].padStart(2, '0');
                const monthKey = `${year}-${month}`;

                if (!groups[monthKey]) {
                    groups[monthKey] = { rows: [], totalCost: 0, totalItems: 0 };
                }

                groups[monthKey].rows.push(row);
                groups[monthKey].totalCost += parseValue(row.totalPrice) || 0;
                groups[monthKey].totalItems += 1;
            }
        });
        
        return groups;
    }, [tableData, searchTerm]);

    const sortedMonthKeys = useMemo(() => Object.keys(groupedData).sort().reverse(), [groupedData]);

    useEffect(() => {
        if (sortedMonthKeys.length > 0) {
            setExpandedMonths(new Set([sortedMonthKeys[0]]));
        } else {
            setExpandedMonths(new Set());
        }
    }, [sortedMonthKeys]);

    const handleMonthToggle = (monthKey: string) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthKey)) {
                newSet.delete(monthKey);
            } else {
                newSet.add(monthKey);
            }
            return newSet;
        });
    };

    const formatNumericCell = (value: string | number | null, decimals = 2) => {
        const num = parseValue(value);
        if (num === null) {
            return value || '-';
        }
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const availableYears = useMemo(() => {
        if (!tableData) return [];
        const years = new Set(tableData.map(row => {
            const parts = row.date.split('/');
            return parts.length === 3 ? parseInt(parts[2], 10) : null;
        }).filter((y): y is number => y !== null));
        return Array.from(years).sort((a, b) => b - a);
    }, [tableData]);

    useEffect(() => {
        if (availableYears.length > 0 && selectedYear === null) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    const costByDept = useMemo(() => {
        if (!selectedYear) return [];
        const filteredData = tableData.filter(row => {
            const parts = row.date.split('/');
            return parts.length === 3 && parseInt(parts[2], 10) === selectedYear;
        });
        const costByDeptMap = filteredData.reduce((acc, row) => {
            const key = row.department || 'Unknown';
            acc[key] = (acc[key] || 0) + (parseValue(row.totalPrice) || 0);
            return acc;
        }, {} as { [key: string]: number });
        return Object.entries(costByDeptMap).map(([name, value]) => ({ name, value }));
    }, [tableData, selectedYear]);
    
    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#3B82F6', '#8B5CF6'];
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, fill } = props;
        
        // FIX: Explicitly convert potential 'any' or 'unknown' prop values to number to prevent arithmetic operation errors.
        const numCx = Number(cx) || 0;
        const numCy = Number(cy) || 0;
        const numMidAngle = Number(midAngle) || 0;
        const numInnerRadius = Number(innerRadius) || 0;
        const numOuterRadius = Number(outerRadius) || 0;
        const numPercent = Number(percent) || 0;

        const radiusInside = numInnerRadius + (numOuterRadius - numInnerRadius) * 0.5;
        const xInside = numCx + radiusInside * Math.cos(-numMidAngle * RADIAN);
        const yInside = numCy + radiusInside * Math.sin(-numMidAngle * RADIAN);
        const sin = Math.sin(-numMidAngle * RADIAN);
        const cos = Math.cos(-numMidAngle * RADIAN);
        const sx = numCx + (numOuterRadius + 10) * cos;
        const sy = numCy + (numOuterRadius + 10) * sin;
        const mx = numCx + (numOuterRadius + 25) * cos;
        const my = numCy + (numOuterRadius + 25) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 12;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';
        const formattedValue = `฿${Number(value).toLocaleString('th-TH')}`;
        const percentageText = `${(numPercent * 100).toFixed(0)}%`;
        return (
            <g>
                <text x={xInside} y={yInside} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="bold">
                    {percentageText}
                </text>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} textAnchor={textAnchor} fill={tickColor} fontSize="12">{name}</text>
                <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} dy={14} textAnchor={textAnchor} fill={tickColor} fontSize="12" fontWeight="bold">
                    {formattedValue}
                </text>
            </g>
        );
    };

    const componentMap = useMemo(() => {
        const map: { [key: string]: { component: React.ReactNode; className: string } } = {};

        kpis.forEach((kpi, index) => {
            map[`kpi-${index}`] = {
                component: <KPICard {...kpi} title={t(kpi.title as any)} />,
                className: "col-span-1 sm:col-span-1 lg:col-span-1"
            };
        });
        
        map['monthlyCost'] = {
            component: <MainChart data={chartData} title={t('monthlyConsumablesCost')} theme={theme} valueFormatter={(val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD', notation: 'compact' })} />,
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        map['costByDept'] = {
            component: (
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('costByDepartment')}</h3>
                         {availableYears.length > 1 && (
                            <select
                                value={selectedYear || ''}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                                className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-1 text-sm text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                aria-label="Select year for cost by department"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                            <Pie data={costByDept} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} labelLine={false} label={renderCustomizedLabel} paddingAngle={2}>
                                {costByDept.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => value.toLocaleString(undefined, {minimumFractionDigits: 2})} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ),
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        map['topItems'] = {
            component: (
                 <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col h-full">
                    <div className="p-6 border-b border-light-border dark:border-dark-border">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('top10FrequentItems')}</h3>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-light-border dark:border-dark-border">
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">#</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('headerDescription')}</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('totalCost')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                {topItems.map((item, index) => (
                                    <tr key={item.material} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer" onClick={() => handleTopItemClick(item)}>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary font-medium">{index + 1}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary truncate" title={item.name}>{item.name}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{`฿${formatNumericCell(item.totalCost)}`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ),
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        return map;
    }, [kpis, chartData, topItems, theme, t, availableYears, selectedYear, costByDept, componentOrder]);

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageConsumables')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => <KPICard key={index} {...kpi} title={t(kpi.title as any)} />)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {componentOrder.map((componentId, index) => {
                    const item = componentMap[componentId];
                    if (!item) return null;
                    const isKpiCard = componentId.startsWith('kpi-');
                    if (isKpiCard) return null; // KPIs are rendered above

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
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('recentTransactions')}</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            placeholder={t('searchTransactions')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-auto max-h-[800px]">
                    {sortedMonthKeys.map(monthKey => {
                        const { rows, totalCost } = groupedData[monthKey];
                        const isExpanded = expandedMonths.has(monthKey);
                        return (
                            <React.Fragment key={monthKey}>
                                <div
                                    className="sticky top-0 bg-slate-100 dark:bg-dark-bg/60 z-[9] cursor-pointer p-3 flex justify-between items-center"
                                    onClick={() => handleMonthToggle(monthKey)}
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{formatMonthForDisplay(monthKey)}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                                        {`${t('subtotal')}: ฿${formatNumericCell(totalCost)}`}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <table className="w-full text-left min-w-[1024px]">
                                        <thead>
                                            <tr className="border-b border-light-border dark:border-dark-border">
                                                {headers.map(h => <th key={h} className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase whitespace-nowrap">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, index) => (
                                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                                    {columnOrder.map((key, colIndex) => (
                                                        <td key={key} className={`p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap ${numericHeaders.includes(headers[colIndex]) ? 'text-right' : ''}`}>
                                                            {numericHeaders.includes(headers[colIndex]) ? formatNumericCell(row[key]) : row[key]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 dark:bg-dark-bg/50 font-bold">
                                                <td colSpan={6} className="p-4 text-right">{t('subtotal')}</td>
                                                <td className="p-4 text-right">{formatNumericCell(totalCost)}</td>
                                                <td colSpan={2}></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>

            {selectedTopItem && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTopItem(null)}>
                    <div 
                        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                    {t('topItemDetailsModalTitle')}
                                </h2>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1 max-w-md truncate" title={selectedTopItem.name}>
                                    {selectedTopItem.name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedTopItem(null)} className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-light-card dark:bg-dark-card">
                                    <tr className="border-b border-light-border dark:border-dark-border">
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('department')}</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('totalCost')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                    {topItemDetails.map(detail => (
                                        <tr key={detail.department}>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{detail.department}</td>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{`฿${formatNumericCell(detail.totalCost)}`}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border flex justify-end">
                             <button
                                onClick={() => setSelectedTopItem(null)}
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

export default ConsumablesReport;
