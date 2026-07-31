import '../assets/css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { setupAudioUnlock } from '@/lib/notification-audio';
import AccountSettingLayout from './layouts/app-layout/account-setting-layout';
import AppLayout from './layouts/app-layout/app-layout';
import AuthLayout from './layouts/auth-layout/auth-layout';

import.meta.glob([
    '../assets/fonts/**/*',
    '../assets/images/**/*',
    '../assets/audio/**/*',
]);

configureEcho({
    broadcaster: 'reverb',
});

setupAudioUnlock();

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'home':
                return null;
            case name.startsWith('display/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/account/'):
                return [AppLayout, AccountSettingLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delay={0}>
                {app}
                <Toaster richColors />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
