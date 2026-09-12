import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    Stack,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

/**
 * Resolves the primary card thumbnail URL and full gallery list for a ServiceItem.
 * - Prioritizes new multi-image gallery from ServiceItemImage (primary image as thumbnail)
 * - Fallbacks to legacy image_url if no gallery images exist yet
 * - Fallbacks to defaultFallback if neither exists
 */
export function getServiceItemMedia(item, defaultFallback = '/images/services/default.jpg') {
    if (!item) {
        return {
            primary: defaultFallback,
            gallery: [defaultFallback],
            count: 1,
            hasMultiple: false,
        };
    }

    // 1. Direct item.images array if loaded
    if (Array.isArray(item.images) && item.images.length > 0) {
        const sorted = [...item.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const resolve = (img) => {
            if (!img) return null;
            const p = img.image_url || img.image_path;
            if (!p) return null;
            return p.startsWith('http') ? p : `/storage/${p}`;
        };

        const gallery = sorted.map(resolve).filter(Boolean);
        const primaryObj = sorted.find((img) => img.is_primary) || sorted[0];
        const primary = resolve(primaryObj) || gallery[0] || item.primary_image_url || item.image_url || defaultFallback;

        return {
            primary,
            gallery: gallery.length > 0 ? gallery : [primary],
            count: gallery.length > 0 ? gallery.length : 1,
            hasMultiple: gallery.length > 1,
        };
    }

    // 2. Eloquent appended gallery_image_urls
    if (Array.isArray(item.gallery_image_urls) && item.gallery_image_urls.length > 0) {
        const primary = item.primary_image_url || item.gallery_image_urls[0] || item.image_url || defaultFallback;
        return {
            primary,
            gallery: item.gallery_image_urls,
            count: item.gallery_image_urls.length,
            hasMultiple: item.gallery_image_urls.length > 1,
        };
    }

    // 3. Fallback to single primary_image_url or image_url
    const single = item.primary_image_url || item.image_url || defaultFallback;
    return {
        primary: single,
        gallery: [single],
        count: 1,
        hasMultiple: false,
    };
}

/**
 * ServiceGalleryModal
 *
 * Renders an interactive full photo gallery modal for customer service items.
 */
export default function ServiceGalleryModal({
    open,
    onClose,
    title = 'Photo Showcase',
    subtitle = '',
    images = [],
    initialIndex = 0,
    onBook = null,
    bookLabel = 'Proceed to Book',
    tariff = '',
}) {
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    useEffect(() => {
        if (open) {
            setActiveIndex(initialIndex >= 0 && initialIndex < images.length ? initialIndex : 0);
        }
    }, [open, initialIndex, images.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            } else if (e.key === 'ArrowRight') {
                setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, images.length, onClose]);

    if (!images || images.length === 0) {
        return null;
    }

    const currentImage = images[activeIndex] || images[0];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3.5,
                    bgcolor: '#0F172A',
                    color: '#F8FAFC',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                },
            }}
        >
            <DialogTitle
                sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 850, color: '#FFFFFF', lineHeight: 1.2 }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                        icon={<PhotoLibraryIcon sx={{ fontSize: '14px !important', color: '#38BDF8 !important' }} />}
                        label={`${activeIndex + 1} / ${images.length}`}
                        size="small"
                        sx={{
                            bgcolor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38BDF8',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                        }}
                    />
                    <IconButton onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#020617' }}>
                {/* Main Image Display */}
                <Box
                    sx={{
                        position: 'relative',
                        height: { xs: 280, sm: 380, md: 460 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#000000',
                    }}
                >
                    <Box
                        component="img"
                        src={currentImage}
                        alt={`${title} - Photo ${activeIndex + 1}`}
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                        }}
                    />

                    {/* Left arrow */}
                    {images.length > 1 && (
                        <IconButton
                            onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                            sx={{
                                position: 'absolute',
                                left: 12,
                                bgcolor: 'rgba(15, 23, 42, 0.75)',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <ArrowBackIosNewIcon fontSize="small" />
                        </IconButton>
                    )}

                    {/* Right arrow */}
                    {images.length > 1 && (
                        <IconButton
                            onClick={() => setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                            sx={{
                                position: 'absolute',
                                right: 12,
                                bgcolor: 'rgba(15, 23, 42, 0.75)',
                                color: '#FFFFFF',
                                '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <ArrowForwardIosIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>

                {/* Thumbnails strip */}
                {images.length > 1 && (
                    <Box
                        sx={{
                            p: 1.5,
                            bgcolor: '#0F172A',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            gap: 1,
                            overflowX: 'auto',
                            justifyContent: { xs: 'flex-start', sm: 'center' },
                        }}
                    >
                        {images.map((imgUrl, idx) => (
                            <Box
                                key={idx}
                                component="img"
                                src={imgUrl}
                                loading="lazy"
                                alt={`Thumbnail ${idx + 1}`}
                                onClick={() => setActiveIndex(idx)}
                                sx={{
                                    width: { xs: 60, sm: 76 },
                                    height: { xs: 45, sm: 54 },
                                    objectFit: 'cover',
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    border: idx === activeIndex ? '2px solid #38BDF8' : '2px solid transparent',
                                    opacity: idx === activeIndex ? 1 : 0.6,
                                    transition: 'all 0.2s ease',
                                    '&:hover': { opacity: 1, transform: 'scale(1.04)' },
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </Box>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    bgcolor: '#0F172A',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Box>
                    {tariff && (
                        <Typography variant="subtitle2" sx={{ fontWeight: 850, color: '#38BDF8' }}>
                            {tariff}
                        </Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button onClick={onClose} sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'none' }}>
                        Close
                    </Button>
                    {onBook && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                onClose();
                                onBook();
                            }}
                            sx={{
                                bgcolor: '#0284C7',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { bgcolor: '#0369A1' },
                            }}
                        >
                            {bookLabel}
                        </Button>
                    )}
                </Stack>
            </DialogActions>
        </Dialog>
    );
}
