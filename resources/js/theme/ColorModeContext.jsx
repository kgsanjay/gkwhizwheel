import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from './index';

const ColorModeContext = createContext({
    mode: 'dark',
    toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export function ColorModeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('whizwheel_color_mode');
            if (saved === 'light' || saved === 'dark') {
                return saved;
            }
        }
        return 'dark'; // Default to sleek dark mode
    });

    const toggleColorMode = () => {
        setMode((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            if (typeof window !== 'undefined') {
                localStorage.setItem('whizwheel_color_mode', next);
            }
            return next;
        });
    };

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', mode);
            if (mode === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [mode]);

    const colorMode = useMemo(() => ({ mode, toggleColorMode }), [mode]);
    const theme = useMemo(() => getTheme(mode), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}
