import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Paper,
    TextField,
    Button,
    Divider,
    Alert,
    Stack,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditNoteIcon from '@mui/icons-material/EditNote';

export default function SettingsIndex({ settings = {} }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        primary_phone: settings.primary_phone || '+918660989586',
        whatsapp_number: settings.whatsapp_number || '918660989586',
        support_email: settings.support_email || 'contact@whizwheels.in',
        operating_hours_label: settings.operating_hours_label || 'Open 24/7',
        tagline: settings.tagline || 'Coastal Travel Hub • Rides, Stays & Experiences',
        explore_label: settings.explore_label || 'Explore',
        locations_summary: settings.locations_summary || 'Honnavar & Murudeshwar',
        google_rating_label: settings.google_rating_label || '5.0 Google Rated (324+)',
        google_rating_value: settings.google_rating_value || '5.0',
        google_reviews_count: settings.google_reviews_count || '324+',
        google_maps_reviews_url: settings.google_maps_reviews_url || 'https://maps.app.goo.gl/y94Ap38BbZGWGSDdA',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/settings', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout title="Global Platform Settings">
            <Head title="Global Site Settings - Admin" />

            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
                        Global Site & Platform Settings
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Manage customer-facing contacts, operating hours, brand messaging, and review social proof across all coastal touchpoints.
                    </Typography>
                </Box>
            </Box>

            {recentlySuccessful && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    Platform settings updated and cached successfully across public website and customer channels.
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Communication & Helpline Desk */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <PhoneIcon color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Helpline & Contact Desk
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                                Primary contact coordinates displayed on sticky TopBar, footer, and automated SMS/email alerts.
                            </Typography>

                            <Stack spacing={2.5}>
                                <TextField
                                    label="Primary Phone Number"
                                    fullWidth
                                    size="small"
                                    value={data.primary_phone}
                                    onChange={(e) => setData('primary_phone', e.target.value)}
                                    error={Boolean(errors.primary_phone)}
                                    helperText={errors.primary_phone || 'Display phone for click-to-call links (e.g., +918660989586)'}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />

                                <TextField
                                    label="WhatsApp Support Number (with Country Code)"
                                    fullWidth
                                    size="small"
                                    value={data.whatsapp_number}
                                    onChange={(e) => setData('whatsapp_number', e.target.value)}
                                    error={Boolean(errors.whatsapp_number)}
                                    helperText={errors.whatsapp_number || 'Clean digits only (e.g., 918660989586)'}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><WhatsAppIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />

                                <TextField
                                    label="Customer Support Email"
                                    fullWidth
                                    size="small"
                                    type="email"
                                    value={data.support_email}
                                    onChange={(e) => setData('support_email', e.target.value)}
                                    error={Boolean(errors.support_email)}
                                    helperText={errors.support_email || 'Official email address for bookings and inquiries'}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />

                                <TextField
                                    label="Operating Hours Status"
                                    fullWidth
                                    size="small"
                                    value={data.operating_hours_label}
                                    onChange={(e) => setData('operating_hours_label', e.target.value)}
                                    error={Boolean(errors.operating_hours_label)}
                                    helperText={errors.operating_hours_label || 'Status pill rendered on customer header (e.g., Open 24/7)'}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Brand Tagline & Location Scope */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <EditNoteIcon color="secondary" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Brand Messaging & Regional Scope
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                                Editorial phrases and hub territory labels displayed in Tier 1 top bar and metadata.
                            </Typography>

                            <Stack spacing={2.5}>
                                <TextField
                                    label="Platform Brand Tagline"
                                    fullWidth
                                    size="small"
                                    value={data.tagline}
                                    onChange={(e) => setData('tagline', e.target.value)}
                                    error={Boolean(errors.tagline)}
                                    helperText={errors.tagline || 'e.g., Coastal Travel Hub • Rides, Stays & Experiences'}
                                />

                                <TextField
                                    label="Locations Summary Pill"
                                    fullWidth
                                    size="small"
                                    value={data.locations_summary}
                                    onChange={(e) => setData('locations_summary', e.target.value)}
                                    error={Boolean(errors.locations_summary)}
                                    helperText={errors.locations_summary || 'e.g., Honnavar & Murudeshwar'}
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" /></InputAdornment>,
                                        }
                                    }}
                                />

                                <TextField
                                    label="Explore Button Label"
                                    fullWidth
                                    size="small"
                                    value={data.explore_label}
                                    onChange={(e) => setData('explore_label', e.target.value)}
                                    error={Boolean(errors.explore_label)}
                                    helperText={errors.explore_label || 'e.g., Explore'}
                                />
                            </Stack>
                        </Paper>
                    </Grid>

                    {/* Social Proof & Google Review Ratings */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <StarIcon sx={{ color: '#F59E0B' }} />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Google Ratings & Trust Badges
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                                Customer review metrics displayed in the header trust badge, search dock, and schema markup.
                            </Typography>

                            <Grid container spacing={2.5}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Review Badge Label"
                                        fullWidth
                                        size="small"
                                        value={data.google_rating_label}
                                        onChange={(e) => setData('google_rating_label', e.target.value)}
                                        error={Boolean(errors.google_rating_label)}
                                        helperText={errors.google_rating_label || 'e.g., 5.0 Google Rated (324+)'}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Average Rating Value"
                                        fullWidth
                                        size="small"
                                        value={data.google_rating_value}
                                        onChange={(e) => setData('google_rating_value', e.target.value)}
                                        error={Boolean(errors.google_rating_value)}
                                        helperText={errors.google_rating_value || 'e.g., 5.0'}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        label="Total Reviews Count"
                                        fullWidth
                                        size="small"
                                        value={data.google_reviews_count}
                                        onChange={(e) => setData('google_reviews_count', e.target.value)}
                                        error={Boolean(errors.google_reviews_count)}
                                        helperText={errors.google_reviews_count || 'e.g., 324+'}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Google Maps Reviews Direct Link"
                                        fullWidth
                                        size="small"
                                        value={data.google_maps_reviews_url}
                                        onChange={(e) => setData('google_maps_reviews_url', e.target.value)}
                                        error={Boolean(errors.google_maps_reviews_url)}
                                        helperText={errors.google_maps_reviews_url || 'Target URL for review pill clicks'}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{ px: 4, py: 1.2, fontWeight: 700, borderRadius: 2 }}
                    >
                        {processing ? 'Saving Settings...' : 'Save Platform Settings'}
                    </Button>
                </Box>
            </form>
        </AdminLayout>
    );
}

