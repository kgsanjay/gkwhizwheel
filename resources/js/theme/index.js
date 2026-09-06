import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0F172A', // Deep Slate / Navy
            light: '#1E293B',
            dark: '#020617',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#F59E0B', // Electric Amber / Orange
            light: '#FBBF24',
            dark: '#D97706',
            contrastText: '#0F172A',
        },
        background: {
            default: '#F8FAFC', // Slate 50
            paper: '#FFFFFF',
        },
        text: {
            primary: '#0F172A',
            secondary: '#64748B',
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
            main: '#3B82F6',
        },
        divider: '#E2E8F0',
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
            color: '#0F172A',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '-0.02em',
            color: '#0F172A',
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.5rem',
            letterSpacing: '-0.015em',
            color: '#0F172A',
        },
        h4: {
            fontWeight: 600,
            fontSize: '1.25rem',
            color: '#0F172A',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.1rem',
            color: '#0F172A',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
            color: '#0F172A',
        },
        subtitle1: {
            fontSize: '1rem',
            color: '#64748B',
        },
        subtitle2: {
            fontSize: '0.875rem',
            color: '#64748B',
            fontWeight: 500,
        },
        body1: {
            fontSize: '0.9375rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            color: '#64748B',
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
                },
                containedPrimary: {
                    backgroundColor: '#0F172A',
                    '&:hover': {
                        backgroundColor: '#1E293B',
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
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                    border: '1px solid #E2E8F0',
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
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#0F172A',
                    color: '#FFFFFF',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    borderRadius: 6,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'small',
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#94A3B8',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0F172A',
                        borderWidth: 2,
                    },
                },
            },
        },
    },
});

export default theme;
