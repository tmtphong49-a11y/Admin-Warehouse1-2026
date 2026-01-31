import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';
import { useTranslation } from '../context/LanguageProvider';
import { ChartDataPoint } from '../types';

interface MainChartProps {
  data: ChartDataPoint[];
  title: string;
  theme: 'light' | 'dark';
  targetValue?: number;
  valueFormatter?: (value: number) => string;
  yAxisTicks?: number[];
  yAxisDomain?: [number | string, number | string];
}

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = formatter ? formatter(value) : value?.toLocaleString();
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 border border-light-border dark:border-dark-border rounded-lg shadow-lg">
        <p className="label text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">{`${label}`}</p>
        <p className="intro text-brand-primary">{`Value : ${formattedValue}`}</p>
      </div>
    );
  }
  return null;
};

const DataLabel = (props: any) => {
    const { x, y, width, value, theme, formatter } = props;
    const textColor = theme === 'dark' ? '#94A3B8' : '#64748B';
    if (value === 0 || !value) {
        return null;
    }
    const formattedValue = formatter ? formatter(value) : value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    return (
        <text x={x + width / 2} y={y} dy={-6} fill={textColor} fontSize={12} textAnchor="middle">
            {formattedValue}
        </text>
    );
};

const MainChart: React.FC<MainChartProps> = ({ data, title, theme, targetValue, valueFormatter, yAxisTicks, yAxisDomain }) => {
  const { t } = useTranslation();
  const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
  const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

  const dataMax = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const yAxisMax = targetValue !== undefined 
    ? Math.max(dataMax, targetValue) * 1.2 
    : dataMax * 1.2;

  const formattedTargetLabel = targetValue !== undefined
    ? `Target: ${valueFormatter ? valueFormatter(targetValue) : targetValue}`
    : '';

  return (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
      <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{title || t('kpiProgressOverview')}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={tickColor} tick={{ fill: tickColor }} />
          <YAxis 
            stroke={tickColor} 
            tick={{ fill: tickColor }} 
            domain={yAxisDomain || [0, yAxisMax]}
            ticks={yAxisTicks}
            tickFormatter={valueFormatter}
          />
          <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
          
          {targetValue !== undefined && (
            <ReferenceLine
              y={targetValue}
              label={{ value: formattedTargetLabel, position: 'right', fill: '#EF4444' }}
              stroke="#EF4444"
              strokeDasharray="3 3"
            />
          )}

          <Bar dataKey="value" fill="#6366F1">
            <LabelList dataKey="value" content={<DataLabel theme={theme} formatter={valueFormatter} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MainChart;