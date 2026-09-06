import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
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
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App {...props} />
                </ThemeProvider>
            </QueryClientProvider>
        );
    },
    progress: {
        color: '#F59E0B',
    },
});
