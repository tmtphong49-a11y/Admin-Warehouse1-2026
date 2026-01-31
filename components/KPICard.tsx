
import React from 'react';
import { ArrowTrendingDownIcon, CheckCircleIcon, MinusIcon } from './icons';
import { useTranslation } from '../context/LanguageProvider';
import { Kpi } from '../types';
import { ICON_MAP } from '../constants';

const KPICard: React.FC<Kpi> = ({ kpiNo, title, value, subValue, subValuePosition, target, trend, trendDirection = 'neutral', icon, color, comparison }) => {
  const { t } = useTranslation();

  // Helper to get matching background and border classes based on the brand color
  const getColorStyles = (colorClass: string) => {
    switch (colorClass) {
      case 'text-brand-primary':
        return {
          bg: 'bg-indigo-50/40 dark:bg-indigo-500/5',
          border: 'border-brand-primary',
          iconBg: 'bg-brand-primary/10',
          numberBg: 'bg-brand-primary text-white'
        };
      case 'text-brand-success':
        return {
          bg: 'bg-emerald-50/40 dark:bg-emerald-500/5',
          border: 'border-brand-success',
          iconBg: 'bg-brand-success/10',
          numberBg: 'bg-brand-success text-white'
        };
      case 'text-brand-danger':
        return {
          bg: 'bg-red-50/40 dark:bg-red-500/5',
          border: 'border-brand-danger',
          iconBg: 'bg-brand-danger/10',
          numberBg: 'bg-brand-danger text-white'
        };
      case 'text-brand-secondary':
        return {
          bg: 'bg-pink-50/40 dark:bg-pink-500/5',
          border: 'border-brand-secondary',
          iconBg: 'bg-brand-secondary/10',
          numberBg: 'bg-brand-secondary text-white'
        };
      case 'text-brand-warning':
        return {
          bg: 'bg-amber-50/40 dark:bg-amber-500/5',
          border: 'border-brand-warning',
          iconBg: 'bg-brand-warning/10',
          numberBg: 'bg-brand-warning text-white'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/50',
          border: 'border-slate-400',
          iconBg: 'bg-slate-100',
          numberBg: 'bg-slate-600 text-white'
        };
    }
  };

  const styles = getColorStyles(color);

  const TrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <CheckCircleIcon className="h-4 w-4 text-brand-success" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-brand-danger" />;
      default:
        return <MinusIcon className="h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary" />;
    }
  };

  const IconComponent = ICON_MAP[icon];
  const trendColor = trendDirection === 'up' ? 'text-brand-success' : trendDirection === 'down' ? 'text-brand-danger' : 'text-light-text-secondary dark:text-dark-text-secondary';
  
  const ComparisonDisplay = () => {
    if (comparison) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] flex-wrap font-medium">
          <TrendIcon />
          <div className="flex items-baseline gap-1">
            <span className={trendColor}>{comparison.percentage}</span>
          </div>
          <span className="text-light-text-secondary dark:text-dark-text-secondary opacity-70">
            {comparison.period === 'year' ? t('vsLastYear') : t('vsLastMonth')}
          </span>
        </div>
      );
    }
    if (trend) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <TrendIcon />
          <span className={`${trendColor} uppercase tracking-tighter`}>{trend}</span>
        </div>
      );
    }
    return null;
  };

  if (!kpiNo) {
    return (
      <div className={`relative ${styles.bg} border-t-4 ${styles.border} border-x border-b border-light-border dark:border-dark-border rounded-xl p-4 flex flex-col items-center text-center transform hover:-translate-y-1 transition-all duration-300 shadow-md min-h-[180px]`}>
        <h3 className="text-[12px] sm:text-[13px] font-bold text-light-text-secondary dark:text-dark-text-secondary w-full leading-tight mb-2 uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex-1 flex flex-col justify-center items-center gap-2 py-1">
          <div className={`${color} ${styles.iconBg} p-2 rounded-lg`}>
            {IconComponent && <IconComponent className="h-6 w-6" />}
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-light-text-primary dark:text-dark-text-primary tracking-tighter">{value}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 mt-auto pt-1">
          <ComparisonDisplay />
          {subValue && (
            <span className="text-[9px] font-semibold text-light-text-secondary dark:text-dark-text-secondary italic opacity-80">{subValue}</span>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${styles.bg} border-t-4 ${styles.border} border-x border-b border-light-border dark:border-dark-border rounded-xl p-4 pt-10 flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300 shadow-md min-h-[240px]`}>
      
      {kpiNo && (
        <div className={`absolute top-3 left-3 ${styles.numberBg} rounded-full h-6 w-6 flex items-center justify-center font-black text-[10px] flex-shrink-0 z-10 shadow-sm`}>
          {kpiNo}
        </div>
      )}

      <div className={`${color} absolute top-3 right-3 opacity-90`}>
        {IconComponent && <IconComponent className="h-6 w-6" />}
      </div>

      <div className="flex-1 mb-4">
        <h3 className="text-[12px] sm:text-[13px] font-bold text-light-text-primary dark:text-dark-text-primary leading-snug break-words">
          {title}
        </h3>
        {subValue && (
          <p className="text-[9px] text-light-text-secondary dark:text-dark-text-secondary mt-1 font-semibold italic opacity-80">
            ({subValue})
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
          <div className="flex items-baseline gap-1.5">
            <p className="text-3xl sm:text-4xl font-black text-light-text-primary dark:text-dark-text-primary tracking-tighter">{value}</p>
          </div>
          {target && target !== 'N/A' && (
            <p className="text-[9px] text-light-text-secondary dark:text-dark-text-secondary font-bold mt-1 tracking-tight">
              {t('target')}: <span className="text-light-text-primary dark:text-dark-text-primary">{target}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <ComparisonDisplay />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
