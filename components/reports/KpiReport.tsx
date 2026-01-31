
import React, { useMemo } from 'react';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import DonutChartContainer from '../DonutChartContainer';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, TableRow } from '../../types';
import { getKpiIcon, getShortKpiTitle } from '../../constants';
import { DocumentTextIcon } from '../icons';

interface KpiReportProps {
  kpis: Kpi[];
  tableRows: TableRow[];
  theme: 'light' | 'dark';
}

const KpiReport: React.FC<KpiReportProps> = ({ kpis, tableRows, theme }) => {
  const { t, language } = useTranslation();

  if (tableRows.length === 0) {
    return (
        <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
            <div className="text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageKpi')}</p>
            </div>
        </div>
    );
  }

  const spotlightKpis = useMemo(() => {
    const spotlightConfig = [
        { kpiNo: '1', color: 'text-brand-primary' },
        { kpiNo: '2', color: 'text-brand-success' },
        { kpiNo: '3', color: 'text-brand-danger' },
        { kpiNo: '4', color: 'text-brand-secondary' },
        { kpiNo: '5', color: 'text-brand-warning' },
    ];
    
    return spotlightConfig.map(config => {
        const kpiDetails = tableRows.find(row => row.kpiNo === config.kpiNo);
        const summaryKpi = kpis.find(k => k.title === kpiDetails?.kpi.title);

        if (!kpiDetails || !summaryKpi) return null;

        let percentage = 0;
        let isValidPercentage = false;

        if (kpiDetails.kpiNo === '1') {
            const scoreValue = parseFloat(summaryKpi.value);
            const targetValue = 15;
            if (!isNaN(scoreValue) && !isNaN(targetValue) && targetValue > 0) {
              percentage = (scoreValue / targetValue) * 100;
              isValidPercentage = true;
            }
        } else {
            const parsed = parseFloat(summaryKpi.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(parsed)) {
                percentage = parsed;
                isValidPercentage = true;
            }
        }

        return {
            title: getShortKpiTitle(summaryKpi.title, language),
            value: isValidPercentage ? `${percentage}%` : 'N/A',
            icon: getKpiIcon(summaryKpi.title),
            color: config.color,
        } as Kpi;
    }).filter((k): k is Kpi => k !== null);

  }, [kpis, tableRows, language]);


  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
        {kpis.map((kpi) => {
          // Find the matching row to get additional data like measurement or KPI number
          const kpiDetails = tableRows.find(row => row.kpi.title === kpi.title);
          return (
            <KPICard
              key={kpi.title}
              {...kpi}
              // Use the original title from uploaded data to keep full info (EN + TH)
              title={kpi.title} 
              kpiNo={kpiDetails?.kpiNo}
              // Add measurement as subValue for better context
              subValue={kpiDetails?.kpi.measurement}
              subValuePosition="inline"
            />
          );
        })}
      </div>
      
      <DonutChartContainer spotlightKpis={spotlightKpis} />
      
      <DataTable data={tableRows} />
    </div>
  );
};

export default KpiReport;
