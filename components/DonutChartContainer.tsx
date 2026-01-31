import React from 'react';
import DonutChartCard from './DonutChartCard';
import { Kpi } from '../types';

interface DonutChartContainerProps {
  spotlightKpis: Kpi[];
}

const DonutChartContainer: React.FC<DonutChartContainerProps> = ({ spotlightKpis }) => {
  if (spotlightKpis.length === 0) {
    return null;
  }

  return (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6">
       <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">KPI Spotlight</h3>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {spotlightKpis.map(kpi => (
              <DonutChartCard
                  key={kpi.title}
                  title={kpi.title}
                  value={kpi.value}
                  icon={kpi.icon}
                  color={kpi.color}
              />
          ))}
      </div>
    </div>
  );
};

export default DonutChartContainer;
