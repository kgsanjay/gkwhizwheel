import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, Stack, Chip, Paper } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PlaceIcon from '@mui/icons-material/Place';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset resolution
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CITY_PRESETS = [
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { name: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
    { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
    { name: 'Goa', lat: 15.2993, lng: 74.124 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
];

export default function MapPicker({
    latitude,
    longitude,
    onChange,
    height = '360px',
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    const initialLat = Number(latitude) || 12.9716;
    const initialLng = Number(longitude) || 77.5946;

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Map instance
        const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: 13,
            scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;

        // Add OpenStreetMap Standard Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Add Draggable Marker
        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        marker.bindPopup('<strong>Store Hub Location</strong><br/>Drag pin or click on the map to set location.');

        // Marker drag handler
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            if (onChange) {
                onChange({
                    latitude: Number(pos.lat.toFixed(6)),
                    longitude: Number(pos.lng.toFixed(6)),
                });
            }
        });

        // Map click handler
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            if (onChange) {
                onChange({
                    latitude: Number(lat.toFixed(6)),
                    longitude: Number(lng.toFixed(6)),
                });
            }
        });

        // Invalidate map size to prevent rendering glitches
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Sync marker & center when parent lat/long changes
    useEffect(() => {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && markerRef.current && mapInstanceRef.current) {
            const currentPos = markerRef.current.getLatLng();
            const diffLat = Math.abs(currentPos.lat - lat);
            const diffLng = Math.abs(currentPos.lng - lng);

            if (diffLat > 0.0001 || diffLng > 0.0001) {
                markerRef.current.setLatLng([lat, lng]);
                mapInstanceRef.current.panTo([lat, lng]);
            }
        }
    }, [latitude, longitude]);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = Number(position.coords.latitude.toFixed(6));
                const lng = Number(position.coords.longitude.toFixed(6));
                if (mapInstanceRef.current && markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                    mapInstanceRef.current.flyTo([lat, lng], 15);
                }
                if (onChange) {
                    onChange({ latitude: lat, longitude: lng });
                }
            },
            (error) => {
                alert(`Unable to retrieve location: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleCityPreset = (cityLat, cityLng) => {
        if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([cityLat, cityLng]);
            mapInstanceRef.current.flyTo([cityLat, cityLng], 14);
        }
        if (onChange) {
            onChange({ latitude: cityLat, longitude: cityLng });
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Quick Actions & Presets Strip */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
                sx={{ mb: 1.5 }}
            >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                        Jump to:
                    </Typography>
                    {CITY_PRESETS.map((city) => (
                        <Chip
                            key={city.name}
                            label={city.name}
                            size="small"
                            onClick={() => handleCityPreset(city.lat, city.lng)}
                            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                        />
                    ))}
                </Stack>

                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MyLocationIcon fontSize="small" />}
                    onClick={handleLocateMe}
                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.8rem', py: 0.5 }}
                >
                    Use GPS Location
                </Button>
            </Stack>

            {/* Map Canvas */}
            <Paper
                elevation={0}
                sx={{
                    height,
                    width: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: height }} />
            </Paper>

            {/* Coordinate Status Bar */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: 'grey.50',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <PlaceIcon color="primary" sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Selected Pin: {Number(latitude) ? Number(latitude).toFixed(6) : '—'}, {Number(longitude) ? Number(longitude).toFixed(6) : '—'}
                    </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                    Powered by OpenStreetMap (Zero API Cost)
                </Typography>
            </Box>
        </Box>
    );
}
