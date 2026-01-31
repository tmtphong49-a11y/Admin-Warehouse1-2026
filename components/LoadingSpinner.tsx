
import React from 'react';
import { BoltIcon } from './icons';
import { useTranslation } from '../context/LanguageProvider';

const LoadingSpinner: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-light-bg dark:bg-dark-bg">
            <div className="flex items-center">
                <BoltIcon className="h-16 w-16 text-brand-primary animate-pulse" />
                <span className="text-3xl font-bold ml-4 text-light-text-secondary dark:text-dark-text-secondary">Loading Dashboard...</span>
            </div>
            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">Please wait while we fetch your data.</p>
        </div>
    );
};

export default LoadingSpinner;
