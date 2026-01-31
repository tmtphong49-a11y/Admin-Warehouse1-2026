
import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from './icons';
import { useTranslation } from '../context/LanguageProvider';
import { TableRow } from '../types';
import { formatScoreForKpiDetails } from '../constants';

interface DataTableProps {
  data: TableRow[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKpi, setSelectedKpi] = useState<TableRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const filteredData = data.filter(row => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      row.kpi.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      (row.kpi.measurement && row.kpi.measurement.toLowerCase().includes(lowerCaseSearchTerm)) ||
      row.target.toLowerCase().includes(lowerCaseSearchTerm) ||
      String(row.score).toLowerCase().includes(lowerCaseSearchTerm) ||
      row.result.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const handleRowClick = (row: TableRow) => {
    setSelectedKpi(row);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKpi(null);
  };
  
  return (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
      <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('kpiDetails')}</h3>
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
          <input
            type="text"
            placeholder={t('searchDetails')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
          />
        </div>
      </div>
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
            <tr className="border-b border-light-border dark:border-dark-border">
              <th className="px-2 py-3 sm:p-4 text-xs sm:text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">KPI NO.</th>
              <th className="px-2 py-3 sm:p-4 text-xs sm:text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">KPI Title</th>
              <th className="px-2 py-3 sm:p-4 text-xs sm:text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">Target</th>
              <th className="px-2 py-3 sm:p-4 text-xs sm:text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">Score</th>
              <th className="px-2 py-3 sm:p-4 text-xs sm:text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">Result</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-light-border dark:divide-dark-border text-xs sm:text-sm'>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
              <tr 
                key={index} 
                className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(row)}
                title="คลิกเพื่อดูรายละเอียดเพิ่มเติม"
              >
                <td className="p-2 sm:p-4">
                  <div className="font-medium text-light-text-primary dark:text-dark-text-primary">{row.kpiNo || 'N/A'}</div>
                </td>
                <td className="p-2 sm:p-4 max-w-xs">
                  <div className="font-medium text-light-text-primary dark:text-dark-text-primary whitespace-normal break-words" title={row.kpi.title}>{row.kpi.title}</div>
                </td>
                <td className="p-2 sm:p-4">
                    <div className="font-medium text-light-text-primary dark:text-dark-text-primary">{row.target}</div>
                </td>
                <td className="p-2 sm:p-4 font-medium text-light-text-primary dark:text-dark-text-primary text-right">{formatScoreForKpiDetails(row.score, row.kpi.title)}</td>
                <td className="p-2 sm:p-4 text-right">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        row.result.toUpperCase() === 'PASS' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                        {row.result.toUpperCase() === 'PASS' ? t('pass') : t('inProgress')}
                    </span>
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-8 text-light-text-secondary dark:text-dark-text-secondary">
                  {t('noResultsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && selectedKpi && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                    {selectedKpi.kpi.title}
                </h2>
                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                    {selectedKpi.kpi.measurement}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
                aria-label={t('close')}
              >
                <XMarkIcon className="h-6 w-6 text-light-text-secondary dark:text-dark-text-secondary" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-light-bg dark:bg-dark-bg rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase mb-2">{t('targetModal')}</h3>
                    <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{selectedKpi.target}</p>
                </div>
                <div className="bg-light-bg dark:bg-dark-bg rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase mb-2">{t('scoreModal')}</h3>
                    <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                      {formatScoreForKpiDetails(selectedKpi.score, selectedKpi.kpi.title)}
                    </p>
                </div>
                <div className="bg-light-bg dark:bg-dark-bg rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase mb-2">{t('resultModal')}</h3>
                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedKpi.result.toUpperCase() === 'PASS' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedKpi.result.toUpperCase() === 'PASS' ? t('pass') : t('inProgress')}
                    </span>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">{t('monthlyData')}</h3>
                <div className="grid grid-cols-6 gap-3">
                  {Object.entries(selectedKpi.monthlyData).map(([month, value]) => (
                    <div key={month} className="text-center">
                      <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">{month}</label>
                        <div className="p-2 text-sm bg-light-bg dark:bg-dark-bg rounded text-light-text-primary dark:text-dark-text-primary text-center border border-light-border dark:border-dark-border">
                          {value || '-'}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('descriptionModal')}</h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedKpi.description || 'ไม่มีข้อมูล'}
                    </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('objective')}</h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedKpi.objective || 'ไม่มีข้อมูล'}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('measurementMethod')}</h3>
                      <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                        {selectedKpi.measurementMethod || 'ไม่มีข้อมูล'}
                      </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('responsible')}</h3>
                      <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                        {selectedKpi.responsible || 'ไม่มีข้อมูล'}
                      </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">{t('improvementPlan')}</h3>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed whitespace-pre-wrap">
                      {selectedKpi.improvementPlan || 'ไม่มีข้อมูล'}
                    </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-light-border dark:border-dark-border flex justify-end">
              <button
                onClick={closeModal}
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

export default DataTable;