import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ColorModeProvider } from './theme/ColorModeContext';
import queryClient from './api/queryClient';

const appName = import.meta.env.VITE_APP_NAME || 'GK WhizWheel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <QueryClientProvider client={queryClient}>
                <ColorModeProvider>
                    <App {...props} />
                </ColorModeProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#F59E0B',
    },
});

if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration ignored in unsupported environments
        });
    });
}
