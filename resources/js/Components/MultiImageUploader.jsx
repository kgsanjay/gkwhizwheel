import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Stack,
    Button,
    IconButton,
    Chip,
    Alert,
    Tooltip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * MultiImageUploader
 *
 * Provides drag-and-drop multiple image uploading, reordering (left/right & drag),
 * primary photo designation, and deletion.
 *
 * Props:
 * - existingImages: Array of ServiceItemImage / BikeImage objects from backend
 * - data: Inertia useForm data object
 * - setData: Inertia useForm setData function
 * - errors: Inertia useForm errors object
 * - maxFileSizeMb: Max file size in MB (default 5MB)
 * - title: Header title
 * - helperText: Subtitle/helper guidance
 */
export default function MultiImageUploader({
    existingImages = [],
    data,
    setData,
    errors = {},
    maxFileSizeMb = 5,
    title = 'Service Showcase & Gallery Images',
    helperText = 'Upload high-resolution photos for customer catalog, vouchers, and booking flows.',
}) {
    // Staged list of items representing both existing and newly added photos in display order
    // Item format:
    // { key: string, isExisting: boolean, id?: number, file?: File, previewUrl: string, isPrimary: boolean, sortOrder: number }
    const [items, setItems] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    // Initialize items from existingImages once on mount or when existingImages changes
    useEffect(() => {
        const initial = (existingImages || []).map((img, idx) => ({
            key: `existing-${img.id}`,
            isExisting: true,
            id: img.id,
            previewUrl: img.image_path?.startsWith('http')
                ? img.image_path
                : `/storage/${img.image_path}`,
            isPrimary: Boolean(img.is_primary || idx === 0),
            sortOrder: img.sort_order ?? idx,
        }));

        // If no existing images, but parent has a legacy image_url, show it as an initial visual item
        if (initial.length === 0 && data.image_url) {
            initial.push({
                key: 'legacy-url',
                isExisting: false,
                isLegacyUrl: true,
                previewUrl: data.image_url,
                isPrimary: true,
                sortOrder: 0,
            });
        }

        setItems(initial);
    }, [existingImages]);

    // Synchronize parent form state whenever items change
    const syncParentState = (currentItems) => {
        const newFiles = [];
        let newPrimaryIndex = null;
        let existingPrimaryId = null;
        const existingOrder = [];
        let primaryUrl = '';

        currentItems.forEach((item) => {
            if (item.isExisting) {
                existingOrder.push(item.id);
                if (item.isPrimary) {
                    existingPrimaryId = item.id;
                    primaryUrl = item.previewUrl;
                }
            } else if (item.file) {
                const idx = newFiles.length;
                newFiles.push(item.file);
                if (item.isPrimary) {
                    newPrimaryIndex = idx;
                    primaryUrl = item.previewUrl;
                }
            } else if (item.isLegacyUrl && item.isPrimary) {
                primaryUrl = item.previewUrl;
            }
        });

        // If no primary is explicitly selected, make the first item primary
        if (currentItems.length > 0 && !existingPrimaryId && newPrimaryIndex === null) {
            const first = currentItems[0];
            if (first.isExisting) {
                existingPrimaryId = first.id;
            } else if (first.file) {
                newPrimaryIndex = 0;
            }
            primaryUrl = first.previewUrl;
        }

        setData((prev) => ({
            ...prev,
            images: newFiles,
            primary_image_index: newPrimaryIndex,
            primary_image_id: existingPrimaryId,
            image_order: existingOrder,
            image_url: primaryUrl || prev.image_url || '',
        }));
    };

    const handleFiles = (files) => {
        if (!files || files.length === 0) return;
        setUploadError('');

        const validFiles = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                setUploadError(`File "${file.name}" is not an image.`);
                return;
            }
            if (file.size > maxFileSizeMb * 1024 * 1024) {
                setUploadError(`File "${file.name}" exceeds ${maxFileSizeMb}MB limit.`);
                return;
            }
            validFiles.push(file);
        }

        const newItems = validFiles.map((file, idx) => ({
            key: `new-${Date.now()}-${idx}-${Math.random()}`,
            isExisting: false,
            file,
            previewUrl: URL.createObjectURL(file),
            isPrimary: items.length === 0 && idx === 0, // First item is primary if empty
            sortOrder: items.length + idx,
        }));

        const updated = [...items, ...newItems];
        setItems(updated);
        syncParentState(updated);
    };

    const handleSetPrimary = (indexToPrimary) => {
        const updated = items.map((item, idx) => ({
            ...item,
            isPrimary: idx === indexToPrimary,
        }));
        setItems(updated);
        syncParentState(updated);
    };

    const handleMove = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= items.length) return;
        const reordered = [...items];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        // Reassign sort orders sequentially
        const updated = reordered.map((item, idx) => ({
            ...item,
            sortOrder: idx,
        }));

        setItems(updated);
        syncParentState(updated);
    };

    const handleRemove = (indexToRemove) => {
        const itemToRemove = items[indexToRemove];
        const wasPrimary = itemToRemove.isPrimary;

        // If removing an existing backend image, record in delete_image_ids
        if (itemToRemove.isExisting && itemToRemove.id) {
            setData((prev) => ({
                ...prev,
                delete_image_ids: [...(prev.delete_image_ids || []), itemToRemove.id],
            }));
        }

        const updated = items.filter((_, idx) => idx !== indexToRemove);

        // If deleted image was primary and others remain, set first as primary
        if (wasPrimary && updated.length > 0) {
            updated[0] = { ...updated[0], isPrimary: true };
        }

        setItems(updated);
        syncParentState(updated);
    };

    // Native Drag and Drop for files
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Tile reordering drag & drop
    const handleTileDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleTileDragOver = (e, index) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleTileDrop = (e, targetIndex) => {
        e.preventDefault();
        setDragOverIndex(null);
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
            handleMove(sourceIndex, targetIndex);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Section Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhotoLibraryIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                        {title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {helperText}
                    </Typography>
                </Box>
                {items.length > 0 && (
                    <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label={`${items.length} ${items.length === 1 ? 'Photo' : 'Photos'}`}
                        color="success"
                        size="small"
                        sx={{ height: 24, fontSize: '0.75rem', fontWeight: 700 }}
                    />
                )}
            </Stack>

            {/* Error alerts */}
            {uploadError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setUploadError('')}>
                    {uploadError}
                </Alert>
            )}
            {errors.images && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {errors.images}
                </Alert>
            )}
            {errors['images.0'] && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {errors['images.0']}
                </Alert>
            )}

            {/* Drag & Drop Upload Zone */}
            <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragging ? 'secondary.main' : 'divider',
                    borderRadius: 3,
                    p: { xs: 2.5, sm: 3.5 },
                    textAlign: 'center',
                    bgcolor: isDragging ? 'rgba(245, 158, 11, 0.08)' : 'background.default',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    mb: 2.5,
                    '&:hover': {
                        borderColor: 'secondary.main',
                        bgcolor: 'rgba(245, 158, 11, 0.04)',
                    },
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                />

                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        bgcolor: 'rgba(245, 158, 11, 0.12)',
                        color: 'warning.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                    }}
                >
                    <CloudUploadIcon sx={{ fontSize: 28 }} />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary' }}>
                    Drag & Drop Images Here, or <Box component="span" sx={{ color: 'secondary.main', textDecoration: 'underline' }}>Browse Files</Box>
                </Typography>

                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    You can select multiple photos at once. Click star on any photo to set it as primary.
                </Typography>

                <Stack direction="row" spacing={0.8} justifyContent="center">
                    <Chip size="small" label="JPG" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                    <Chip size="small" label="PNG" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                    <Chip size="small" label="WEBP" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                    <Chip size="small" label={`Max ${maxFileSizeMb}MB`} color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                </Stack>
            </Box>

            {/* Gallery Grid */}
            {items.length > 0 && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(1, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                        },
                        gap: 2,
                    }}
                >
                    {items.map((item, index) => (
                        <Box
                            key={item.key}
                            draggable
                            onDragStart={(e) => handleTileDragStart(e, index)}
                            onDragOver={(e) => handleTileDragOver(e, index)}
                            onDrop={(e) => handleTileDrop(e, index)}
                            sx={{
                                position: 'relative',
                                borderRadius: 2.5,
                                overflow: 'hidden',
                                border: '2px solid',
                                borderColor: item.isPrimary
                                    ? 'warning.main'
                                    : dragOverIndex === index
                                    ? 'secondary.main'
                                    : 'divider',
                                bgcolor: 'background.paper',
                                boxShadow: item.isPrimary
                                    ? '0 4px 16px rgba(245, 158, 11, 0.25)'
                                    : '0 2px 8px rgba(0,0,0,0.08)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                },
                            }}
                        >
                            {/* Image Thumbnail Container */}
                            <Box sx={{ position: 'relative', height: 160, bgcolor: 'neutral.900' }}>
                                <Box
                                    component="img"
                                    src={item.previewUrl}
                                    alt={`Photo ${index + 1}`}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/600x400?text=Invalid+Image';
                                    }}
                                />

                                {/* Primary Badge */}
                                {item.isPrimary && (
                                    <Chip
                                        icon={<StarIcon sx={{ fontSize: '0.85rem !important', color: '#fff' }} />}
                                        label="PRIMARY"
                                        size="small"
                                        color="warning"
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            fontWeight: 800,
                                            fontSize: '0.68rem',
                                            height: 22,
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                        }}
                                    />
                                )}

                                {/* Status Chip (New vs Saved) */}
                                <Chip
                                    label={item.isExisting ? 'Saved' : 'Staged'}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        fontWeight: 700,
                                        fontSize: '0.65rem',
                                        height: 20,
                                        bgcolor: 'rgba(0,0,0,0.65)',
                                        color: '#fff',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                />
                            </Box>

                            {/* Controls Bar */}
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{
                                    p: 1,
                                    px: 1.5,
                                    bgcolor: 'background.default',
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                {/* Set Primary Action */}
                                <Tooltip title={item.isPrimary ? 'Primary Showcase Photo' : 'Set as Primary Photo'}>
                                    <Button
                                        size="small"
                                        variant={item.isPrimary ? 'contained' : 'outlined'}
                                        color={item.isPrimary ? 'warning' : 'inherit'}
                                        onClick={() => handleSetPrimary(index)}
                                        startIcon={item.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            py: 0.3,
                                            px: 1,
                                            borderRadius: 1.5,
                                        }}
                                    >
                                        {item.isPrimary ? 'Primary' : 'Make Primary'}
                                    </Button>
                                </Tooltip>

                                {/* Ordering & Delete Actions */}
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Tooltip title="Move Earlier">
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={index === 0}
                                                onClick={() => handleMove(index, index - 1)}
                                                sx={{ p: 0.5 }}
                                            >
                                                <ArrowBackIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Move Later">
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={index === items.length - 1}
                                                onClick={() => handleMove(index, index + 1)}
                                                sx={{ p: 0.5 }}
                                            >
                                                <ArrowForwardIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Remove Photo">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemove(index)}
                                            sx={{ p: 0.5, ml: 0.5 }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
