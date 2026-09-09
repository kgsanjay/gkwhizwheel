import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'dark') => {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? '#38BDF8' : '#0F172A',
                light: isDark ? '#7DD3FC' : '#1E293B',
                dark: isDark ? '#0284C7' : '#020617',
                contrastText: isDark ? '#0B1120' : '#FFFFFF',
            },
            secondary: {
                main: '#F59E0B', // Electric Amber
                light: '#FBBF24',
                dark: '#D97706',
                contrastText: '#0F172A',
            },
            background: {
                default: isDark ? '#0B1120' : '#F8FAFC',
                paper: isDark ? '#131D2F' : '#FFFFFF',
            },
            text: {
                primary: isDark ? '#F8FAFC' : '#0F172A',
                secondary: isDark ? '#CBD5E1' : '#334155',
            },
            success: {
                main: '#10B981',
            },
            error: {
                main: '#EF4444',
            },
            warning: {
                main: '#F59E0B',
            },
            info: {
                main: '#38BDF8',
            },
            divider: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
        },
        typography: {
            fontFamily: [
                'Inter',
                'Roboto',
                '-apple-system',
                'BlinkMacSystemFont',
                '"Segoe UI"',
                'sans-serif',
            ].join(','),
            h1: {
                fontWeight: 800,
                fontSize: '2.5rem',
                letterSpacing: '-0.025em',
                color: isDark ? '#F8FAFC' : '#0F172A',
            },
            h2: {
                fontWeight: 700,
                fontSize: '2rem',
                letterSpacing: '-0.02em',
                color: isDark ? '#F8FAFC' : '#0F172A',
            },
            h3: {
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: '-0.015em',
                color: isDark ? '#F8FAFC' : '#0F172A',
            },
            h4: {
                fontWeight: 600,
                fontSize: '1.25rem',
                color: isDark ? '#F8FAFC' : '#0F172A',
            },
            h5: {
                fontWeight: 600,
                fontSize: '1.1rem',
                color: isDark ? '#F8FAFC' : '#0F172A',
            },
            h6: {
                fontWeight: 600,
                fontSize: '1rem',
                color: isDark ? '#F8FAFC' : '#0F172A',
            },
            subtitle1: {
                fontSize: '1rem',
                color: isDark ? '#CBD5E1' : '#334155',
            },
            subtitle2: {
                fontSize: '0.875rem',
                color: isDark ? '#CBD5E1' : '#334155',
                fontWeight: 600,
            },
            body1: {
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                color: isDark ? '#E2E8F0' : '#1E293B',
            },
            body2: {
                fontSize: '0.875rem',
                color: isDark ? '#CBD5E1' : '#334155',
            },
            button: {
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.01em',
            },
        },
        shape: {
            borderRadius: 10,
        },
        components: {
            MuiButton: {
                defaultProps: {
                    disableElevation: true,
                },
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        padding: '8px 20px',
                        fontWeight: 600,
                        transition: 'all 0.15s ease-in-out',
                        '&:focus-visible': {
                            outline: '3px solid #F59E0B',
                            outlineOffset: '2px',
                        },
                    },
                    containedPrimary: {
                        backgroundColor: isDark ? '#F59E0B' : '#0F172A',
                        color: isDark ? '#0B1120' : '#FFFFFF',
                        '&:hover': {
                            backgroundColor: isDark ? '#D97706' : '#1E293B',
                        },
                    },
                    containedSecondary: {
                        backgroundColor: '#F59E0B',
                        color: '#0F172A',
                        '&:hover': {
                            backgroundColor: '#D97706',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        backgroundColor: isDark ? '#131D2F' : '#FFFFFF',
                        boxShadow: isDark
                            ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)'
                            : '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    rounded: {
                        borderRadius: 12,
                    },
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        fontSize: '0.875rem',
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        '& input[type="date"], & input[type="time"], & input[type="datetime-local"]': {
                            colorScheme: isDark ? 'dark' : 'light',
                        },
                    },
                },
            },
        },
    });
};

const defaultTheme = getTheme('dark');
export default defaultTheme;
