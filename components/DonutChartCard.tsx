import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Kpi } from '../types';
import { ICON_MAP } from '../constants';

const DonutChartCard: React.FC<Kpi> = ({ title, value, icon, color }) => {
    // Parse the percentage value from the string (e.g., "85.0%")
    const percentage = parseFloat(value.replace(/[^0-9.-]/g, ''));
    const isValidPercentage = !isNaN(percentage);

    // Clamp the value for display in the chart to be between 0 and 100
    const donutDisplayPercentage = Math.max(0, Math.min(100, percentage));

    const chartData = isValidPercentage
        ? [
            { name: 'Completed', value: donutDisplayPercentage },
            { name: 'Remaining', value: 100 - donutDisplayPercentage },
          ]
        : [
            { name: 'Completed', value: 0 },
            { name: 'Remaining', value: 100 },
          ];

    const IconComponent = ICON_MAP[icon];
    
    // Define colors for the chart segments based on the provided color class
    const colorMap: { [key: string]: string } = {
        'text-brand-success': '#10B981',
        'text-brand-primary': '#6366F1',
        'text-brand-warning': '#F59E0B',
        'text-brand-secondary': '#EC4899',
        'text-brand-danger': '#EF4444',
    };
    
    const activeColor = colorMap[color] || '#6366F1'; // Default to primary if color not found

    return (
        <div className="flex flex-col gap-4 min-h-[200px] p-4 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-border dark:border-dark-border">
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary pr-2 leading-tight">{title}</h3>
                <div className={color}>
                    {IconComponent && <IconComponent className="h-6 w-6 flex-shrink-0" />}
                </div>
            </div>
            <div className="relative mt-auto flex items-center justify-center h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="70%"
                            outerRadius="90%"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            cornerRadius={5}
                        >
                           <Cell key={`cell-0`} fill={activeColor} />
                           <Cell key={`cell-1`} fill="currentColor" className="text-slate-200 dark:text-slate-700" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                        {isValidPercentage ? (percentage >= 100 ? `${percentage.toFixed(0)}%` : `${percentage.toFixed(2)}%`) : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DonutChartCard;