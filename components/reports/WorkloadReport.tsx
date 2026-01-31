
import React, { useMemo } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { WorkloadProductSection } from '../../types';
import KPICard from '../KPICard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DocumentTextIcon } from '../icons';

interface WorkloadReportProps {
    data: WorkloadProductSection[];
    theme: 'light' | 'dark';
}

const WorkloadReport: React.FC<WorkloadReportProps> = ({ data, theme }) => {
    const { t } = useTranslation();

    const monthNames = useMemo(() => [
        t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'),
        t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')
    ], [t]);

    const { summaryKpis, chartData } = useMemo(() => {
        if (!data || data.length === 0) {
            return { summaryKpis: [], chartData: [] };
        }

        const getTonPerHrSumForProduct = (productName: string) => {
            const productIndex = data.findIndex(p => p.product === productName);
            if (productIndex === -1 || !data[productIndex + 1]) return [];
            const tonHrSection = data[productIndex + 1];
            if (tonHrSection && tonHrSection.product === 'Ton/Person/Hr.' && tonHrSection.isSubProduct) {
                const sumRow = tonHrSection.rows.find(r => r.description === 'Sum');
                return sumRow ? sumRow.values : [];
            }
            return [];
        };
        
        const previousYearAverages = {
            ssrm: 2.59,
            coil: 22.22,
            film: 8.40,
        };

        const ssrmTonHr = getTonPerHrSumForProduct('SSRM');
        const coilTonHr = getTonPerHrSumForProduct('COIL');
        const filmTonHr = getTonPerHrSumForProduct('FILM');

        const avg = (arr: (number|null)[]) => {
            if (!arr) return 0;
            const filtered = arr.filter((v): v is number => v !== null);
            if(filtered.length === 0) return 0;
            return filtered.reduce((a, b) => a + b, 0) / filtered.length;
        };
        
        const currentAvgSSRM = avg(ssrmTonHr);
        const currentAvgCOIL = avg(coilTonHr);
        const currentAvgFILM = avg(filmTonHr);

        const createComparison = (current: number, previous: number) => {
            if (previous === 0) return { trendDirection: 'neutral' as const };

            const diff = current - previous;
            const percentage = (diff / previous) * 100;
            const trendDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

            return {
                trendDirection,
                comparison: {
                    value: diff.toFixed(2),
                    percentage: `${percentage.toFixed(2)}%`,
                    period: 'year' as const,
                    previousValue: previous.toFixed(2),
                },
            };
        };

        const ssrmComparison = createComparison(currentAvgSSRM, previousYearAverages.ssrm);
        const coilComparison = createComparison(currentAvgCOIL, previousYearAverages.coil);
        const filmComparison = createComparison(currentAvgFILM, previousYearAverages.film);
        
        const _summaryKpis = [
            {
                title: t('avgWorkloadRaw'),
                value: currentAvgSSRM.toFixed(2),
                icon: 'UserGroupIcon',
                color: 'text-brand-success',
                ...ssrmComparison,
            },
            {
                title: t('avgWorkloadCoil'),
                value: currentAvgCOIL.toFixed(2),
                icon: 'UserGroupIcon',
                color: 'text-brand-primary',
                ...coilComparison,
            },
            {
                title: t('avgWorkloadFilm'),
                value: currentAvgFILM.toFixed(2),
                icon: 'UserGroupIcon',
                color: 'text-brand-warning',
                ...filmComparison,
            },
        ];

        const _chartData = monthNames.map((month, index) => ({
            month,
            [t('chartRawMaterial')]: ssrmTonHr[index] || 0,
            [t('chartCoil')]: coilTonHr[index] || 0,
            [t('chartFilmScrap')]: filmTonHr[index] || 0,
        }));

        return { summaryKpis: _summaryKpis, chartData: _chartData };
    }, [data, t, monthNames]);
    
    if (!data || data.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageWorkload')}</p>
                </div>
            </div>
        );
    }
    
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const formatNumber = (num: number | null | undefined) => {
        if (num === null || num === undefined) return '-';
        return num.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    const valueFormatter = (value: any) => {
        if (typeof value === 'number') {
            return value.toFixed(2);
        }
        return value;
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryKpis.map((kpi, index) => (
                    <KPICard
                        key={index}
                        title={kpi.title}
                        value={kpi.value}
                        icon={kpi.icon}
                        color={kpi.color}
                        // @ts-ignore
                        comparison={kpi.comparison}
                        // @ts-ignore
                        trendDirection={kpi.trendDirection}
                    />
                ))}
            </div>
             <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('workloadByProduct')}</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                        <XAxis dataKey="month" stroke={tickColor} tick={{ fill: tickColor }} />
                        <YAxis stroke={tickColor} tick={{ fill: tickColor }} tickFormatter={valueFormatter}/>
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                                borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                            }}
                            formatter={valueFormatter}
                        />
                        <Legend wrapperStyle={{ color: tickColor }} />
                        <Line type="monotone" dataKey={t('chartRawMaterial')} stroke="#10B981" strokeWidth={2} />
                        <Line type="monotone" dataKey={t('chartCoil')} stroke="#6366F1" strokeWidth={2} />
                        <Line type="monotone" dataKey={t('chartFilmScrap')} stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col overflow-hidden">
                 <div className="p-6 border-b border-light-border dark:border-dark-border">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('workloadDetails')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto border-collapse">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="px-2 py-3 text-[10px] font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary">{t('product')}</th>
                                <th className="px-2 py-3 text-[10px] font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary min-w-[120px]">{t('description')}</th>
                                <th className="px-1 py-3 text-[10px] font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary text-center">{t('unit')}</th>
                                {monthNames.map(m => <th key={m} className="px-1 py-3 text-[9px] font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary text-right">{m}</th>)}
                                <th className="px-1 py-3 text-[9px] font-bold uppercase text-light-text-primary dark:text-dark-text-primary text-right bg-indigo-50/30 dark:bg-indigo-900/10">AVG</th>
                                <th className="px-1 py-3 text-[9px] font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary text-right">MIN</th>
                                <th className="px-1 py-3 text-[9px] font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary text-right">MAX</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                           {data.map((productSection, sectionIndex) => (
                                <React.Fragment key={sectionIndex}>
                                    {!productSection.isSubProduct && (
                                        <tr className="bg-slate-50 dark:bg-dark-bg/50">
                                            <td colSpan={18} className="px-2 py-2 font-bold text-xs text-brand-primary uppercase tracking-wider">
                                                {productSection.product}
                                            </td>
                                        </tr>
                                    )}
                                    {productSection.rows.map((row, rowIndex) => (
                                        <tr key={`${sectionIndex}-${rowIndex}`} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                                             <td className="px-2 py-1.5 text-[10px] text-light-text-secondary dark:text-dark-text-secondary">
                                                {productSection.isSubProduct && rowIndex === 0 &&
                                                    <span className="font-bold">{productSection.product}</span>
                                                }
                                            </td>
                                            <td className={`px-2 py-1.5 text-[10px] ${row.isSubRow ? 'pl-4 text-light-text-secondary italic' : 'font-semibold text-light-text-primary dark:text-dark-text-primary'}`}>
                                                {row.description}
                                            </td>
                                            <td className="px-1 py-1.5 text-[9px] text-light-text-secondary dark:text-dark-text-secondary text-center whitespace-nowrap">{row.unit}</td>
                                            {row.values.map((val, i) => (
                                                <td key={i} className={`px-1 py-1.5 text-[10px] text-right whitespace-nowrap ${val === null ? 'text-slate-300 dark:text-slate-700' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                                                    {formatNumber(val)}
                                                </td>
                                            ))}
                                            <td className="px-1 py-1.5 text-[10px] text-right whitespace-nowrap font-bold text-brand-primary bg-indigo-50/20 dark:bg-indigo-900/5">
                                                {formatNumber(row.average)}
                                            </td>
                                            <td className="px-1 py-1.5 text-[10px] text-right whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
                                                {formatNumber(row.min)}
                                            </td>
                                            <td className="px-1 py-1.5 text-[10px] text-right whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
                                                {formatNumber(row.max)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-dark-bg/30 border-t border-light-border dark:border-dark-border text-[10px] text-light-text-secondary dark:text-dark-text-secondary italic">
                    * Values are displayed with 1 decimal point to fit table dimensions. Full precision is maintained in calculations and charts.
                </div>
            </div>
        </div>
    );
};

export default WorkloadReport;
