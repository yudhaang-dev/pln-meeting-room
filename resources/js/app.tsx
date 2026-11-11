import '../assets/css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { AudioBlockedNotice } from '@/components/features/notification/audio-blocked-notice';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import {
    configureNotificationSound,
    setupAudioUnlock,
} from '@/lib/notification-audio';
import { setupTitleFlash } from '@/lib/title-flash';
import AccountSettingLayout from './layouts/app-layout/account-setting-layout';
import AppLayout from './layouts/app-layout/app-layout';
import AuthLayout from './layouts/auth-layout/auth-layout';
import DisplayLayout from './layouts/display-layout/display-layout';

import.meta.glob([
    '../assets/fonts/**/*',
    '../assets/images/**/*',
    '../assets/audio/**/*',
]);

// Host WebSocket diambil dari alamat yang dipakai browser (Reverb berjalan di
// server yang sama dengan web). Key/port/scheme disisipkan server saat runtime,
// jadi tidak perlu build ulang saat IP/host server berubah.
const reverb = (
    window as unknown as {
        __REVERB__?: { key?: string; port?: number; scheme?: string };
    }
).__REVERB__;

configureEcho({
    broadcaster: 'reverb',
    ...(reverb?.key
        ? {
              key: reverb.key,
              wsHost: window.location.hostname,
              wsPort: reverb.port,
              wssPort: reverb.port,
              forceTLS: reverb.scheme === 'https',
              enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
          }
        : {}),
});

setupAudioUnlock();
setupTitleFlash();

router.on('success', (event) => {
    const notificationSound = event.detail.page.props.notificationSound;

    configureNotificationSound((notificationSound as string | null) ?? null);
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'home':
                return null;
            case name.startsWith('display/'):
                return DisplayLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/account/'):
                return [AppLayout, AccountSettingLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app, { page }) {
        configureNotificationSound(
            (page.props.notificationSound as string | null) ?? null,
        );

        return (
            <TooltipProvider delay={0}>
                {app}
                <Toaster richColors />
                <AudioBlockedNotice />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
