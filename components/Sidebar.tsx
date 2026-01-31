
import React, { ReactElement } from 'react';
import { useTranslation } from '../context/LanguageProvider';
import { HomeIcon, ClipboardDocumentListIcon, ClockIcon, CalendarDaysIcon, ExclamationTriangleIcon, UserGroupIcon, ChartPieIcon, DocumentTextIcon, Cog6ToothIcon, QuestionMarkCircleIcon, BoltIcon, XMarkIcon, ChartBarIcon, ShieldCheckIcon, UsersIcon, ClipboardDocumentCheckIcon, StairsIcon, BookIcon, ShoppingCartIcon } from './icons';

interface NavLinkProps {
  icon: ReactElement;
  text: string;
  active: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200 text-left group ${
      active
        ? 'bg-brand-primary text-white font-semibold shadow-lg shadow-indigo-500/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    <span className={`mr-3 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
        {icon}
    </span>
    <span className="text-sm whitespace-nowrap truncate">{text}</span>
  </button>
);

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const { t } = useTranslation();
  
  const navItems = [
    { key: 'kpiReport', icon: <HomeIcon className="h-5 w-5" /> },
    { key: 'consumablesReport', icon: <ClipboardDocumentListIcon className="h-5 w-5" /> },
    { key: 'otReport', icon: <ClockIcon className="h-5 w-5" /> },
    { key: 'leaveReport', icon: <CalendarDaysIcon className="h-5 w-5" /> },
    { key: 'accidentReport', icon: <ExclamationTriangleIcon className="h-5 w-5" /> },
    { key: 'accidentWh1Report', icon: <ShieldCheckIcon className="h-5 w-5" /> },
    { key: 'workloadReport', icon: <UserGroupIcon className="h-5 w-5" /> },
    { key: 'manpowerReport', icon: <UsersIcon className="h-5 w-5" /> },
    { key: 'warningLetterReport', icon: <ClipboardDocumentCheckIcon className="h-5 w-5" /> },
    { key: 'purchaseRequestReport', icon: <ShoppingCartIcon className="h-5 w-5" /> },
    { key: 'trainingReport', icon: <BookIcon className="h-5 w-5" /> },
    { key: 'turnoverReport', icon: <StairsIcon className="h-5 w-5" /> },
    { key: 'comparisonReport', icon: <ChartBarIcon className="h-5 w-5" /> },
    { key: 'reports', icon: <ChartPieIcon className="h-5 w-5" /> },
    { key: 'documents', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { key: 'settings', icon: <Cog6ToothIcon className="h-5 w-5" /> },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-[#1e293b] border-r border-slate-800 p-5 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-8 h-12">
        <div className="flex items-center overflow-hidden">
            <div className="bg-indigo-500/10 p-1.5 rounded-lg mr-2.5">
                <BoltIcon className="h-6 w-6 text-brand-primary flex-shrink-0" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap truncate">{t('analytics')}</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white ml-2">
            <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-700">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            icon={item.icon}
            text={t(item.key as any)}
            active={activePage === item.key}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-slate-800">
        <NavLink 
          icon={<QuestionMarkCircleIcon className="h-5 w-5" />} 
          text={t('helpCenter')}
          active={activePage === 'helpCenter'}
          onClick={() => onNavigate('helpCenter')}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
