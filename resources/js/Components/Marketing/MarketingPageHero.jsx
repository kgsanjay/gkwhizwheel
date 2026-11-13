import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Home-inspired presentation for customer-facing page headers.
 *
 * Content and actions are supplied by each page: this does not replace or
 * rearrange any service-specific section or booking flow.
 */
export const marketingHeroBackground = (dark) => dark
    ? 'radial-gradient(125% 115% at 88% 12%, #132238 0%, #09101D 58%, #050912 100%)'
    : 'linear-gradient(120deg, #F8FAFC 0%, #EFF6FF 68%, #FFF7ED 100%)';

export default function MarketingPageHero({
    eyebrow,
    title,
    description,
    icon,
    accent = '#F59E0B',
    actions,
    children,
    compact = false,
}) {
    const { palette } = useTheme();
    const dark = palette.mode === 'dark';

    return (
        <Box
            component="header"
            sx={{
                position: 'relative',
                overflow: 'hidden',
                isolation: 'isolate',
                borderRadius: { xs: 3, md: 4.5 },
                px: { xs: 2.5, sm: 4, md: 5 },
                py: compact ? { xs: 3, md: 4 } : { xs: 4, md: 6 },
                mb: { xs: 3, md: 4 },
                background: marketingHeroBackground(dark),
                border: dark
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid #E2E8F0',
                boxShadow: dark
                    ? '0 18px 45px -24px rgba(0,0,0,0.6)'
                    : '0 18px 45px -24px rgba(15,23,42,0.16)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    right: { xs: -75, md: -50 },
                    top: -110,
                    width: { xs: 200, md: 320 },
                    height: { xs: 200, md: 320 },
                    borderRadius: '50%',
                    background: accent,
                    opacity: dark ? 0.12 : 0.09,
                    pointerEvents: 'none',
                    zIndex: -1,
                },
            }}
        >
            <Stack spacing={2} alignItems="flex-start" sx={{ position: 'relative' }}>
                {eyebrow && (
                    <Chip icon={icon || undefined} label={eyebrow} size="small"
                        sx={{
                            fontWeight: 850,
                            letterSpacing: '0.045em',
                            bgcolor: dark ? 'rgba(245,158,11,0.14)' : '#FFFBEB',
                            color: dark ? '#FBBF24' : '#92400E',
                            border: `1px solid ${accent}55`,
                            '& .MuiChip-icon': { color: 'inherit' },
                        }} />
                )}
                <Typography component="h1" variant="h2" sx={{
                    fontWeight: 950,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.14,
                    fontSize: compact
                        ? { xs: '1.85rem', sm: '2.3rem', md: '2.65rem' }
                        : { xs: '2.15rem', sm: '2.9rem', md: '3.4rem' },
                    maxWidth: '24ch',
                }}>
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body1" sx={{
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                        lineHeight: 1.7,
                        color: 'text.secondary',
                        maxWidth: 780,
                    }}>
                        {description}
                    </Typography>
                )}
                {actions && <Box sx={{ pt: 1, width: '100%' }}>{actions}</Box>}
                {children}
            </Stack>
        </Box>
    );
}

/** Use for existing information, pricing and checkout cards without changing
 * their content, semantic order or interactive behavior. */
export const marketingPanelSx = (dark) => ({
    borderRadius: { xs: 3, md: 4 },
    overflow: 'hidden',
    backgroundColor: dark ? '#131D2F' : '#FFFFFF',
    border: dark
        ? '1px solid rgba(255,255,255,0.11)'
        : '1px solid #E2E8F0',
    boxShadow: dark
        ? '0 16px 36px -20px rgba(0,0,0,0.65)'
        : '0 16px 36px -20px rgba(15,23,42,0.14)',
});
