import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    Stack,
    Chip,
    IconButton,
    Divider,
} from '@mui/material';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ShieldIcon from '@mui/icons-material/Shield';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export const AVAILABLE_ADDONS = [
    {
        id: 'helmet',
        name: 'Extra ISI Safety Helmet',
        description: 'Sanitized full-face ISI certified helmet for safety',
        unit_price: 100.0,
        icon: SportsMotorsportsIcon,
        allowQuantity: true,
        maxQty: 3,
    },
    {
        id: 'extra_rider',
        name: 'Extra Rider Authorization',
        description: 'Legal authorization & coverage for a secondary co-rider',
        unit_price: 150.0,
        icon: GroupAddIcon,
        allowQuantity: false,
    },
    {
        id: 'insurance',
        name: 'Comprehensive Damage Cover',
        description: 'Zero-deductible waiver for accidental damage protection',
        unit_price: 250.0,
        icon: ShieldIcon,
        allowQuantity: false,
    },
    {
        id: 'gps',
        name: 'GPS Tracker & Phone Mount',
        description: 'Anti-vibration handlebar mobile mount with live navigation',
        unit_price: 100.0,
        icon: GpsFixedIcon,
        allowQuantity: false,
    },
];

export default function AddonsSelector({ selectedAddons = [], onChange }) {
    const isSelected = (addonId) => selectedAddons.some((a) => a.addon_type === addonId);

    const getQuantity = (addonId) => {
        const found = selectedAddons.find((a) => a.addon_type === addonId);
        return found ? found.quantity : 1;
    };

    const handleToggle = (addon) => {
        const exists = isSelected(addon.id);
        if (exists) {
            onChange(selectedAddons.filter((a) => a.addon_type !== addon.id));
        } else {
            onChange([
                ...selectedAddons,
                {
                    addon_type: addon.id,
                    quantity: 1,
                    unit_price: addon.unit_price,
                },
            ]);
        }
    };

    const handleQuantityChange = (addonId, delta) => {
        const updated = selectedAddons.map((a) => {
            if (a.addon_type === addonId) {
                const newQty = Math.max(1, Math.min(3, a.quantity + delta));
                return { ...a, quantity: newQty };
            }
            return a;
        });
        onChange(updated);
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Select Rental Add-ons & Equipment
                </Typography>
                {selectedAddons.length > 0 && (
                    <Chip
                        label={`${selectedAddons.length} selected`}
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 700 }}
                    />
                )}
            </Box>

            <Stack spacing={1.5}>
                {AVAILABLE_ADDONS.map((addon) => {
                    const checked = isSelected(addon.id);
                    const qty = getQuantity(addon.id);
                    const IconComponent = addon.icon;
                    const subtotal = addon.unit_price * (checked ? qty : 1);

                    return (
                        <Card
                            key={addon.id}
                            variant="outlined"
                            sx={{
                                borderColor: checked ? '#F59E0B' : '#E2E8F0',
                                bgcolor: checked ? 'rgba(245, 158, 11, 0.04)' : '#FFFFFF',
                                transition: 'all 0.15s ease-in-out',
                                borderRadius: 2,
                            }}
                        >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Checkbox
                                            checked={checked}
                                            onChange={() => handleToggle(addon)}
                                            color="secondary"
                                            sx={{ p: 0.5 }}
                                        />
                                        <Box
                                            sx={{
                                                bgcolor: checked ? 'rgba(245, 158, 11, 0.15)' : '#F1F5F9',
                                                color: checked ? '#B45309' : '#64748B',
                                                p: 0.8,
                                                borderRadius: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <IconComponent fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                                {addon.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                                {addon.description}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {checked && addon.allowQuantity && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #CBD5E1', px: 0.5 }}>
                                                <IconButton
                                                    size="small"
                                                    disabled={qty <= 1}
                                                    onClick={() => handleQuantityChange(addon.id, -1)}
                                                    sx={{ p: 0.2 }}
                                                >
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                                <Typography variant="body2" sx={{ px: 1, fontWeight: 700 }}>
                                                    {qty}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    disabled={qty >= (addon.maxQty || 3)}
                                                    onClick={() => handleQuantityChange(addon.id, 1)}
                                                    sx={{ p: 0.2 }}
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}

                                        <Box sx={{ minWidth: 65, textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                                + ₹{subtotal}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                                per trip
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>
        </Box>
    );
}
