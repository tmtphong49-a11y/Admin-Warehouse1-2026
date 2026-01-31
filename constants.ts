
import React from 'react';
import {
    AcademicCapIcon, ArchiveBoxIcon, BookIcon, BuildingOfficeIcon, CalendarDaysIcon, ChartBarIcon, ChartPieIcon, ClipboardDocumentCheckIcon, ClockIcon, Cog6ToothIcon, CubeIcon, CurrencyDollarIcon, DocumentTextIcon, ExclamationTriangleIcon, ForkliftIcon, HomeIcon, LeafIcon, MedicalBagIcon, QuestionMarkCircleIcon, ShieldCheckIcon, ShoppingCartIcon, SparklesIcon, StairsIcon, UserGroupIcon, UsersIcon
} from './components/icons';

export const ICON_MAP: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    AcademicCapIcon, ArchiveBoxIcon, BookIcon, BuildingOfficeIcon, CalendarDaysIcon, ChartBarIcon, ChartPieIcon, ClipboardDocumentCheckIcon, ClockIcon, Cog6ToothIcon, CubeIcon, CurrencyDollarIcon, DocumentTextIcon, ExclamationTriangleIcon, ForkliftIcon, HomeIcon, LeafIcon, MedicalBagIcon, QuestionMarkCircleIcon, ShieldCheckIcon, ShoppingCartIcon, SparklesIcon, StairsIcon, UserGroupIcon, UsersIcon
};

export const parseValue = (val: any): number | null => {
    if (val === '-' || val === '#DIV/0!' || val == null || String(val).trim() === '') return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const cleanedString = val.replace(/[^0-9.-]/g, '');
        if (cleanedString === '') return null;
        const num = parseFloat(cleanedString);
        return isNaN(num) ? null : num;
    }
    return null;
};

export const formatPercentage = (percentage: number): string => {
    if (isNaN(percentage)) return 'N/A';
    if (percentage % 1 === 0) {
        return `${percentage.toFixed(0)}%`;
    }
    return `${percentage.toFixed(2)}%`;
};

export const formatScoreAsPercentage = (score: string | number): string => {
    if (!score || score === 'N/A' || score === '-') return String(score);
    
    const numericScore = parseFloat(String(score).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numericScore)) {
        const percentage = numericScore <= 1 && numericScore > 0 ? numericScore * 100 : numericScore;
        return formatPercentage(percentage);
    }
    
    return String(score);
};

export const formatScoreForKpiDetails = (score: string | number, kpiTitle: string): string => {
    if (!score || score === 'N/A' || score === '-') return String(score);
    
    const titleLower = String(kpiTitle).toLowerCase();
    
    if (titleLower.includes('availability') && titleLower.includes('forklift') || 
        titleLower.includes('ความพร้อมของรถยก') || 
        titleLower.includes('avaliability')) {
        
        const numericScore = parseFloat(String(score).replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericScore)) {
            return `${numericScore} วัน`;
        }
        return String(score);
    }
    
    return formatScoreAsPercentage(score);
};

export const modifySpecificKpiScore = (title: string, originalScore: string | number): string => {
    if (!originalScore || originalScore === 'N/A' || originalScore === '-') {
        return String(originalScore);
    }
    
    const titleLower = String(title).toLowerCase();
    
    if (titleLower.includes('availability') && titleLower.includes('forklift') || 
        titleLower.includes('ความพร้อมของรถยก') || 
        titleLower.includes('avaliability')) {
        const numericScore = parseFloat(String(originalScore).replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericScore)) {
            return numericScore.toString();
        }
        return String(originalScore);
    }
    
    return formatScoreAsPercentage(originalScore);
};

export const getShortKpiTitle = (title: string, lang: 'en' | 'th'): string => {
    const titleLower = String(title).toLowerCase();
    
    if (titleLower.includes('availability') || titleLower.includes('ความพร้อมของรถยก') || titleLower.includes('avaliability')) {
        return lang === 'th' ? 'ความพร้อมรถยก' : 'Forklift Availability';
    }
    
    if (titleLower.includes('initiative') || titleLower.includes('carbon') || titleLower.includes('ลดการปล่อยก๊าซคาร์บอน')) {
        return lang === 'th' ? 'ลดคาร์บอน' : 'Carbon Reduction';
    }
    
    if (titleLower.includes('อุบัติเหตุ') || titleLower.includes('ifr')) {
        return lang === 'th' ? 'อัตราอุบัติเหตุ IFR' : 'Accident Rate (IFR)';
    }
    
    if (titleLower.includes('lean') || titleLower.includes('กำหนดแผนพัฒนา')) {
        return lang === 'th' ? 'การจัดการ Lean' : 'Lean Management';
    }
    
    if (titleLower.includes('idp') || titleLower.includes('implementation')) {
        return lang === 'th' ? 'ความสำเร็จ IDP' : 'IDP Success Rate';
    }
    
    return title;
};

export const getKpiIcon = (title: string): string => {
    const titleLower = String(title).toLowerCase();
    
    if (titleLower.includes('availability') || titleLower.includes('ความพร้อมของรถยก') || titleLower.includes('avaliability')) {
        return 'CubeIcon';
    }
    
    if (titleLower.includes('initiative') || titleLower.includes('carbon') || titleLower.includes('ลดการปล่อยก๊าซคาร์บอน')) {
        return 'SparklesIcon';
    }
    
    if (titleLower.includes('อัตราการเกิดอุบัติเหตุ') || titleLower.includes('ifr')) {
        return 'ShieldCheckIcon';
    }
    
    if (titleLower.includes('lean') || titleLower.includes('กำหนดแผนพัฒนา')) {
        return 'ChartPieIcon';
    }
    
    if (titleLower.includes('idp') || titleLower.includes('implementation')) {
        return 'AcademicCapIcon';
    }
    
    return 'ChartBarIcon';
};

export const DB_STORAGE_KEY = 'kpiDashboardDatabase';
