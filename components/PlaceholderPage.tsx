
import React from 'react';
import { useTranslation } from '../context/LanguageProvider';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-light-text-secondary dark:text-dark-text-secondary tracking-tight">{title}</h1>
                <p className="mt-2 text-lg text-light-text-secondary dark:text-dark-text-secondary">{t('underConstruction')}</p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
