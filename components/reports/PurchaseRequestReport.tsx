import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, PurchaseRequestRow, ChartDataPoint } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon } from '../icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PurchaseRequestReportProps {
    tableData: PurchaseRequestRow[];
    kpis: Kpi[];
    byDeptChartData: ChartDataPoint[];
    byStatusChartData: ChartDataPoint[];
    monthlyChartData: ChartDataPoint[];
    theme: 'light' | 'dark';
}

const PurchaseRequestReport: React.FC<PurchaseRequestReportProps> = ({ tableData, kpis, byDeptChartData, byStatusChartData, monthlyChartData, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    const filteredData = useMemo(() => {
        if (!searchTerm) return tableData;
        const lowercasedSearch = searchTerm.toLowerCase();
        return tableData.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(lowercasedSearch)
            )
        );
    }, [tableData, searchTerm]);

    const groupedData = useMemo(() => {
        const groups: { [key: string]: { rows: PurchaseRequestRow[], totalValue: number } } = {};
        filteredData.forEach(row => {
            const dept = row.department || 'Unknown';
            if (!groups[dept]) {
                groups[dept] = { rows: [], totalValue: 0 };
            }
            groups[dept].rows.push(row);
            groups[dept].totalValue += row.totalPrice || 0;
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
    
    const headers = useMemo(() => [
        'ลำดับ', 'เลขที่ PR', 'วันที่เปิด PR', 'รายการสั่งซื้อ', 'วัตถุประสงค์',
        'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวมจำนวนเงิน', 'วันที่รับสินค้า', 'ระยะเวลาการสั่งซื้อ', 'สถานะ'
    ], []);
    
    const statusColors: { [key: string]: string } = {
        'Pending': 'bg-amber-500/20 text-amber-400',
        'Approved': 'bg-blue-500/20 text-blue-400',
        'Rejected': 'bg-red-500/20 text-red-400',
        'Ordered': 'bg-purple-500/20 text-purple-400',
        'Completed': 'bg-green-500/20 text-green-400',
    };

    const DEPT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#3B82F6', '#8B5CF6'];
    const STATUS_COLORS: { [key: string]: string } = {
        'Pending': '#F59E0B',
        'Approved': '#3B82F6',
        'Rejected': '#EF4444',
        'Ordered': '#8B5CF6',
        'Completed': '#10B981',
    };
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, fill } = props;
        
        const numCx = Number(cx || 0);
        const numCy = Number(cy || 0);
        const numMidAngle = Number(midAngle || 0);
        const numInnerRadius = Number(innerRadius || 0);
        const numOuterRadius = Number(outerRadius || 0);
        const numPercent = Number(percent || 0);

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
        
        if (numPercent < 0.05) return null;

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

    if (!tableData || tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessagePurchaseRequest' as any)}</p>
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

            <MainChart
                data={monthlyChartData}
                title={t('monthlyPurchaseValue' as any)}
                theme={theme}
                valueFormatter={(val) => `฿${val.toLocaleString('th-TH', { notation: 'compact' })}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('costByDepartmentPR' as any)}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                            <Pie 
                                data={byDeptChartData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={100} 
                                labelLine={false} 
                                label={renderCustomizedLabel} 
                                paddingAngle={2}
                            >
                                {byDeptChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => `฿${value.toLocaleString('th-TH', {minimumFractionDigits: 2})}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg h-[480px]">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('purchaseStatusBreakdown' as any)}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                             <Pie data={byStatusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                                {byStatusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || DEPT_COLORS[index % DEPT_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${value} request(s)`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Purchase Request Details</h3>
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
                <div className="overflow-auto max-h-[800px]">
                    <table className="w-full text-left min-w-[1600px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                {headers.map(h => <th key={h} className="p-4 text-sm font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                             {groupedData.map(([dept, group]) => {
                                const isDeptExpanded = expandedDepts.has(dept);
                                return (
                                    <React.Fragment key={dept}>
                                        <tr className="bg-slate-100 dark:bg-dark-bg/60 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors" onClick={() => handleDeptToggle(dept)}>
                                            <td colSpan={headers.length} className="p-3">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${isDeptExpanded ? 'rotate-180' : ''}`} />
                                                        <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">{dept} ({group.rows.length} {group.rows.length === 1 ? 'item' : 'items'})</span>
                                                    </div>
                                                    <span className="font-semibold text-sm text-brand-primary">Total: ฿{group.totalValue.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {isDeptExpanded && group.rows.map((row, index) => (
                                            <tr key={row.id + index} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{index + 1}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.id}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.date}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-normal max-w-xs">{row.itemDescription}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-normal max-w-xs">{row.objective}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right">{row.quantity}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.unit}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right">{row.unitPrice.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{row.totalPrice.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.goodsReceivedDate}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-center">{row.leadTimeDays > 0 ? `${row.leadTimeDays} ${t('days')}` : '-'}</td>
                                                <td className="p-4 text-sm">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[row.status] || 'bg-slate-500/20 text-slate-400'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
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

export default PurchaseRequestReport;