
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, AccidentRow } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, ChevronDownIcon, CurrencyDollarIcon, BuildingOfficeIcon } from '../icons';

interface AccidentReportProps {
    tableData: AccidentRow[];
    kpis: Kpi[];
    chartData: ChartDataPoint[];
    theme: 'light' | 'dark';
    noDataMessageKey: 'noDataLoadedMessageAccident' | 'noDataLoadedMessageAccidentWh1';
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{label}</span>
        <span className="text-light-text-primary dark:text-dark-text-primary mt-1">{value || '-'}</span>
    </div>
);

const AccidentReport: React.FC<AccidentReportProps> = ({ tableData, kpis, chartData, theme, noDataMessageKey }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [expandedSeverities, setExpandedSeverities] = useState<Set<string>>(new Set());

    const handleRowToggle = (rowId: string) => {
        setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
    };
    
    const headers = useMemo(() => [
        t('headerSeq'), t('headerIncidentDate'), t('headerSeverity'),
        t('headerNameSurname'), t('headerDetails')
    ], [t]);
    
    const filteredData = useMemo(() => tableData.filter(row =>
        Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    ), [tableData, searchTerm]);
    
    const groupedData = useMemo(() => {
        // FIX: Use a type-asserted initial value instead of a generic on the reduce call to resolve "Untyped function calls may not accept type arguments".
        const groups = filteredData.reduce((acc, row) => {
            const severity = row.severity || 'Unknown';
            if (!acc[severity]) {
                acc[severity] = { rows: [], totalDamage: 0 };
            }
            acc[severity].rows.push(row);
            acc[severity].totalDamage += row.damageValue || 0;
            return acc;
        }, {} as { [key: string]: { rows: AccidentRow[], totalDamage: number } });

        const severityOrder = ['L', 'M', 'S'];
        return Object.entries(groups).sort(([a], [b]) => {
            const indexA = severityOrder.indexOf(a);
            const indexB = severityOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }, [filteredData]);

    useEffect(() => {
        if (searchTerm) {
            setExpandedSeverities(new Set(groupedData.map(g => g[0])));
        } else if (groupedData.length > 0) {
            setExpandedSeverities(new Set([groupedData[0][0]]));
        } else {
            setExpandedSeverities(new Set());
        }
    }, [groupedData, searchTerm]);

    const handleSeverityToggle = (severity: string) => {
        setExpandedSeverities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(severity)) {
                newSet.delete(severity);
            } else {
                newSet.add(severity);
            }
            return newSet;
        });
        setExpandedRowId(null);
    };

    const severityCounts = useMemo(() => {
        return tableData.reduce((acc, row) => {
            const severity = row.severity || 'Unknown';
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    }, [tableData]);

    const damageByDept = useMemo(() => {
        const deptTotals = tableData.reduce((acc, row) => {
            const department = row.department || 'Unknown';
            if (!acc[department]) {
                acc[department] = { totalDamage: 0, caseCount: 0 };
            }
            acc[department].totalDamage += (row.damageValue || 0);
            acc[department].caseCount += 1;
            return acc;
        }, {} as { [key: string]: { totalDamage: number; caseCount: number } });

        return Object.entries(deptTotals)
            .sort(([, valA], [, valB]) => (valB as { totalDamage: number }).totalDamage - (valA as { totalDamage: number }).totalDamage)
            .slice(0, 4);
    }, [tableData]);
    
    const severityByDept = useMemo(() => {
        const deptData = tableData.reduce<Record<string, any>>((acc, row) => {
          const dept = row.department || 'Unknown';
          if (!acc[dept]) {
            acc[dept] = { total: 0 };
          }
          
          let severity = (row.severity || '').trim();
          if (severity === '') {
            severity = 'Unknown';
          }
          
          const currentDept = acc[dept] as any;
          currentDept[severity] = (Number(currentDept[severity]) || 0) + 1;
          currentDept.total = (Number(currentDept.total) || 0) + 1;
          
          return acc;
        }, {});

        return Object.entries(deptData)
            .sort(([, valA], [, valB]) => (valB as any).total - (valA as any).total)
            .slice(0, 4);
    }, [tableData]);

    const severityColors: { [key: string]: string } = {
        'L': 'bg-red-500/20 text-red-400',
        'M': 'bg-amber-500/20 text-amber-400',
        'S': 'bg-yellow-500/20 text-yellow-400',
        'Unknown': 'bg-slate-500/20 text-slate-400',
    };

    const SeverityCard = () => {
        const severityOrder = ['S', 'M', 'L'];
        
        const sortedSeverities = Object.entries(severityCounts).sort(([a], [b]) => {
            const indexA = severityOrder.indexOf(a);
            const indexB = severityOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        const totalIncidents = (Object.values(severityCounts) as number[]).reduce((sum, count) => sum + count, 0);

        return (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 flex flex-col gap-4 min-h-[220px]">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{t('severityBreakdown')}</h3>
                    <ExclamationTriangleIcon className="h-8 w-8 text-brand-danger flex-shrink-0" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-4">
                        {sortedSeverities.length > 0 ? (
                            sortedSeverities.map(([severity, count]) => (
                                <div key={severity} className="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${severityColors[severity] || severityColors['Unknown']}`}>
                                        {severity}
                                    </span>
                                    <span className="mt-2 text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                        {count}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-3 text-center text-light-text-secondary dark:text-dark-text-secondary py-4">{t('noSeverityData')}</div>
                        )}
                    </div>
                    {sortedSeverities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border flex items-baseline justify-center gap-2">
                            <span className="text-md font-semibold text-light-text-secondary dark:text-dark-text-secondary">{t('headerTotal')}:</span>
                            <span className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{totalIncidents}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const DamageByDeptCard = () => {
        return (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 flex flex-col gap-4 min-h-[220px]">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{t('damageByDepartment')}</h3>
                    <CurrencyDollarIcon className="h-8 w-8 text-brand-warning flex-shrink-0" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 content-start">
                     {damageByDept.length > 0 ? (
                        damageByDept.map(([department, data]) => (
                            <div key={department} className="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-3 rounded-lg text-center">
                                <span className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary truncate w-full" title={department}>
                                    {department}
                                </span>
                                <span className="mt-1 text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
                                    {`฿${(data as any).totalDamage.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
                                </span>
                                <span className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                    {`${(data as any).caseCount} ${(data as any).caseCount > 1 ? t('cases') : t('case')}`}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center text-light-text-secondary dark:text-dark-text-secondary py-4">{t('noDataLoaded')}</div>
                    )}
                </div>
            </div>
        );
    };

    const SeverityByDeptCard = () => {
        return (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 flex flex-col gap-4 min-h-[220px]">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{t('severityByDepartment')}</h3>
                    <BuildingOfficeIcon className="h-8 w-8 text-brand-secondary flex-shrink-0" />
                </div>
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                    {severityByDept.length > 0 ? (
                        severityByDept.map(([dept, counts]: [string, any]) => {
                            const { total, ...severities } = counts;
                            const sortedSeverities = Object.entries(severities)
                                .filter(([type]) => type !== 'total')
                                .sort(([, a], [, b]) => Number(b) - Number(a));

                            return (
                                <div key={dept} className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg text-sm">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate" title={dept}>
                                            {dept}
                                        </span>
                                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                            {`${t('headerTotal')}: ${total} ${total === 1 ? t('time_unit') : t('times_unit')}`}
                                        </span>
                                    </div>
                                    {sortedSeverities.length > 0 && (
                                        <div className="pl-2 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                                            {sortedSeverities.map(([type, count]) => (
                                                <div key={type} className="flex justify-between items-center text-xs">
                                                    <span className={`text-light-text-secondary dark:text-dark-text-secondary`}>
                                                        - {type}
                                                    </span>
                                                    <span className={`font-semibold px-1.5 py-0.5 rounded-full ${severityColors[type] || severityColors['Unknown']}`}>
                                                        {`${count} ${Number(count) === 1 ? t('time_unit') : t('times_unit')}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                         <div className="flex-1 flex items-center justify-center text-center text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoaded')}</div>
                    )}
                </div>
            </div>
        );
    };

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t(noDataMessageKey)}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => <KPICard key={index} {...kpi} title={t(kpi.title as any)} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SeverityCard />
                <DamageByDeptCard />
                <SeverityByDeptCard />
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6">
                <MainChart 
                    data={chartData} 
                    title={t('accidentsByDepartment')} 
                    theme={theme}
                    valueFormatter={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                />
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('accidentDetails')}</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            placeholder={t('searchAccidents')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {headers.map(header => <th key={header} className="p-4 text-sm font-semibold whitespace-nowrap">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                            {groupedData.length > 0 ? (
                                groupedData.map(([severity, group]) => {
                                    const isSeverityExpanded = expandedSeverities.has(severity);
                                    return (
                                        <React.Fragment key={severity}>
                                            <tr
                                                className="bg-slate-100 dark:bg-dark-bg/60 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors"
                                                onClick={() => handleSeverityToggle(severity)}
                                            >
                                                <td colSpan={headers.length + 1} className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <ChevronDownIcon 
                                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isSeverityExpanded ? 'rotate-180' : ''}`} 
                                                            />
                                                            <span className={`px-2 py-1 text-sm font-bold rounded-full ${severityColors[severity] || severityColors['Unknown']}`}>
                                                                {severity}
                                                            </span>
                                                            <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">
                                                                {t('headerSeverity')}: {severity}
                                                            </span>
                                                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                                                ({group.rows.length} {group.rows.length > 1 ? t('cases') : t('case')})
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                                                            <span>
                                                            {`${t('totalDamage')}: ฿${group.totalDamage.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isSeverityExpanded && group.rows.map((row) => (
                                                <React.Fragment key={row.id}>
                                                    <tr 
                                                        className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 cursor-pointer"
                                                        onClick={() => handleRowToggle(row.id)}
                                                    >
                                                        <td className="p-4">
                                                            <ChevronDownIcon 
                                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${expandedRowId === row.id ? 'rotate-180' : ''}`} 
                                                            />
                                                        </td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.id}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">{row.incidentDate}</td>
                                                        <td className="p-4 text-sm whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColors[row.severity] || severityColors['Unknown']}`}>
                                                                {row.severity}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm whitespace-nowrap max-w-xs truncate" title={row.employeeName}>{row.employeeName}</td>
                                                        <td className="p-4 text-sm whitespace-normal max-w-lg">{row.details}</td>
                                                    </tr>
                                                    {expandedRowId === row.id && (
                                                        <tr className="bg-slate-200/50 dark:bg-dark-bg/50">
                                                            <td colSpan={headers.length + 1} className="p-0">
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6 bg-light-bg dark:bg-dark-bg/50 p-6">
                                                                    <DetailItem label={t('headerIncidentTime')} value={row.incidentTime} />
                                                                    <DetailItem label={t('headerOccurrence')} value={row.occurrence} />
                                                                    <DetailItem label={t('headerWorkSection')} value={row.department} />
                                                                    <DetailItem label={t('headerEmployeeId')} value={row.employeeId} />
                                                                    <DetailItem label={t('headerPosition')} value={row.position} />
                                                                    <DetailItem label={t('headerDamageValue')} value={`฿ ${row.damageValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`} />
                                                                    <DetailItem label={t('headerInsuranceClaim')} value={row.insuranceClaim} />
                                                                    <DetailItem label={t('headerPenalty')} value={row.penalty} />
                                                                    <DetailItem label={t('headerLocation')} value={row.accidentLocation} />
                                                                    <DetailItem label={t('headerRemarks')} value={row.remarks} />
                                                                    <div className="col-span-full sm:col-span-2 lg:col-span-2">
                                                                        <DetailItem label={t('headerCause')} value={<p className="whitespace-normal">{row.cause}</p>} />
                                                                    </div>
                                                                    <div className="col-span-full sm:col-span-2 lg:col-span-2">
                                                                        <DetailItem label={t('headerPrevention')} value={<p className="whitespace-normal">{row.prevention}</p>} />
                                                                    </div>
                                                                    <div className="col-span-full sm:col-span-2 lg:col-span-2">
                                                                        <DetailItem label={t('headerActionTaken')} value={<p className="whitespace-normal">{row.actionTaken}</p>} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
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

export default AccidentReport;
