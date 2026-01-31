
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../context/LanguageProvider';
import { Bars3Icon, BellIcon, SunIcon, MoonIcon, ArrowUpTrayIcon, ArrowPathIcon, TrashIcon, EllipsisVerticalIcon } from './icons';

interface HeaderProps {
  onFileUpload: (file: File) => void;
  activePage: string;
  pageTitle: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onMenuClick: () => void;
  onLoadFromFirestore: () => void;
  onClearData: () => void;
}

const Header: React.FC<HeaderProps> = ({ onFileUpload, activePage, pageTitle, theme, toggleTheme, onMenuClick, onLoadFromFirestore, onClearData }) => {
  const { t, language, toggleLanguage } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      setIsMoreMenuOpen(false);
    }
  };
  
  const canUpload = ['kpiReport', 'consumablesReport', 'otReport', 'leaveReport', 'accidentReport', 'accidentWh1Report', 'workloadReport', 'manpowerReport', 'warningLetterReport', 'turnoverReport', 'purchaseRequestReport', 'trainingReport'].includes(activePage);

  const actionButtons = (isDropdown: boolean) => (
    <>
      {canUpload && (
          <button 
              onClick={() => { handleUploadClick(); isDropdown && setIsMoreMenuOpen(false); }}
              className={isDropdown ? 'w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-slate-100 dark:hover:bg-dark-border' : 'flex items-center justify-center bg-brand-primary text-white font-semibold h-10 w-10 rounded-lg hover:bg-indigo-500 transition-colors duration-300'}
              aria-label="อัปโหลด Excel"
              title="อัปโหลดไฟล์ Excel"
          >
              {isDropdown ? t('uploadExcel') : <ArrowUpTrayIcon className="h-5 w-5" />}
          </button>
      )}
      <button
        onClick={() => { onClearData(); isDropdown && setIsMoreMenuOpen(false); }}
        className={isDropdown ? 'w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-dark-border' : 'flex items-center justify-center bg-red-600 text-white font-semibold h-10 w-10 rounded-lg hover:bg-red-700 transition-colors duration-300'}
        aria-label="ลบข้อมูล"
        title="ลบข้อมูลทั้งหมด"
      >
        {isDropdown ? 'Delete Data' : <TrashIcon className="h-5 w-5" />}
      </button>
    </>
  );

  return (
    <header className="bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border px-6 py-0 h-[73px] flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center h-full">
         <button onClick={onMenuClick} className="lg:hidden mr-4 text-light-text-secondary dark:text-dark-text-secondary" aria-label="Open menu">
            <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4 h-full">
        {/* Hidden file inputs */}
        {canUpload && <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />}

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          <button
            onClick={onLoadFromFirestore}
            className="flex items-center justify-center bg-green-600 text-white font-semibold h-10 w-10 rounded-lg hover:bg-green-700 transition-colors duration-300"
            aria-label="โหลดข้อมูลจาก Firestore"
            title="โหลดข้อมูลล่าสุดจาก Firestore"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          {actionButtons(false)}
        </div>
        
        {/* Mobile "More" Menu */}
        <div ref={moreMenuRef} className="relative md:hidden">
          <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-dark-border">
            <EllipsisVerticalIcon className="h-6 w-6" />
          </button>
          {isMoreMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-xl z-20 py-1">
              {actionButtons(true)}
              <div className="my-1 h-px bg-light-border dark:border-dark-border"></div>
              <button
                onClick={() => { onLoadFromFirestore(); setIsMoreMenuOpen(false); }}
                className='w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-slate-100 dark:hover:bg-dark-border'
              >
                Load from Cloud
              </button>
            </div>
          )}
        </div>

        {/* Common Buttons */}
        <div className="flex items-center border-l border-light-border dark:border-dark-border pl-4 gap-1 md:gap-3 h-10">
          <button
            onClick={toggleTheme}
            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleLanguage}
            className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors font-bold text-xs w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border border border-light-border dark:border-dark-border"
            aria-label="Toggle language"
          >
            {language === 'en' ? 'TH' : 'EN'}
          </button>
          <button className="relative text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-border">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-secondary"></span>
            </span>
          </button>
        </div>

        <div className="flex items-center border-l border-light-border dark:border-dark-border pl-4 h-10">
            <div className='text-right'>
                <span className="text-[11px] font-extrabold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-md border border-light-border dark:border-dark-border">
                    {t('userRole')}
                </span>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
