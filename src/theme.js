import { createTheme } from '@mui/material/styles';

/**
 * Premium Service Brand Theme
 * 
 * Palette: Deep Indigo, Soft Lavender, Paper White, Charcoal Text
 * Typography: Inter (Google Font)
 * Elevation: Soft "floating" shadows
 */

const theme = createTheme({
    palette: {
        primary: {
            main: '#3730A3', // Deep Indigo
            light: '#4F46E5',
            dark: '#312E81',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#818CF8', // Soft Lavender
            light: '#A5B4FC',
            dark: '#6366F1',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F8FAFC', // Soft Paper / Slate 50
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E293B', // Charcoal / Slate 800
            secondary: '#64748B', // Slate 500
        },
    },
    typography: {
        fontFamily: '"Inter", "Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            color: '#1E293B',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
            color: '#1E293B',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        subtitle1: {
            fontWeight: 500,
            fontSize: '1.125rem',
        },
        body1: {
            fontWeight: 400,
            fontSize: '1rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0px 1px 2px rgba(15, 23, 42, 0.05)',
        '0px 4px 6px -1px rgba(15, 23, 42, 0.1), 0px 2px 4px -1px rgba(15, 23, 42, 0.06)', // Elevation 2 (Soft)
        '0px 10px 15px -3px rgba(15, 23, 42, 0.1), 0px 4px 6px -2px rgba(15, 23, 42, 0.05)',
        '0px 20px 25px -5px rgba(15, 23, 42, 0.1), 0px 10px 10px -5px rgba(15, 23, 42, 0.04)', // Elevation 4 (Floating)
        '0px 25px 50px -12px rgba(15, 23, 42, 0.25)',
        ...Array(19).fill('none') // Standardizing rest to none for strict design
    ],
    spacing: 8, // 8pt grid
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0px 4px 12px rgba(55, 48, 163, 0.2)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0px 10px 15px -3px rgba(15, 23, 42, 0.1)', // Uniform floating look
                    border: '1px solid #F1F5F9',
                },
            },
        },
    },
});

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export default theme;
