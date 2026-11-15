import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    Chip,
    Paper,
    TextField,
    InputAdornment,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LayersIcon from '@mui/icons-material/Layers';
import MapIcon from '@mui/icons-material/Map';
import SatelliteIcon from '@mui/icons-material/Satellite';
import TerrainIcon from '@mui/icons-material/Terrain';
import PublicIcon from '@mui/icons-material/Public';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset resolution
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coastal Karnataka operating hubs & key regional hubs
const CITY_PRESETS = [
    { name: 'Honnavar', lat: 14.2802, lng: 74.4439 },
    { name: 'Murudeshwar', lat: 14.094, lng: 74.4899 },
    { name: 'Gokarna', lat: 14.5479, lng: 74.3188 },
    { name: 'Kumta', lat: 14.4258, lng: 74.4172 },
    { name: 'Karwar', lat: 14.8135, lng: 74.1297 },
    { name: 'Bhatkal', lat: 13.9774, lng: 74.5663 },
    { name: 'Goa', lat: 15.2993, lng: 74.124 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
];

const MAP_LAYERS = {
    google_roadmap: {
        name: 'Google Maps',
        url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps',
    },
    google_hybrid: {
        name: 'Satellite',
        url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Satellite & Imagery',
    },
    google_terrain: {
        name: 'Terrain',
        url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Terrain',
    },
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
};

export default function MapPicker({
    latitude,
    longitude,
    onChange,
    height = '420px',
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const currentLayerRef = useRef(null);

    const [activeLayer, setActiveLayer] = useState('google_roadmap');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const initialLat = Number(latitude) || 14.2802; // Default to Honnavar coastal hub
    const initialLng = Number(longitude) || 74.4439;

    // Switch map tile layer
    const switchLayer = useCallback((layerKey) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const layerConfig = MAP_LAYERS[layerKey] || MAP_LAYERS.google_roadmap;

        if (currentLayerRef.current) {
            map.removeLayer(currentLayerRef.current);
        }

        const newLayer = L.tileLayer(layerConfig.url, {
            maxZoom: layerConfig.maxZoom,
            subdomains: layerConfig.subdomains,
            attribution: layerConfig.attribution,
        }).addTo(map);

        currentLayerRef.current = newLayer;
        setActiveLayer(layerKey);
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Map
        const map = L.map(mapContainerRef.current, {
            center: [initialLat, initialLng],
            zoom: 13,
            scrollWheelZoom: true,
        });

        mapInstanceRef.current = map;

        // Add Google Roadmap as default layer
        const defaultLayerConfig = MAP_LAYERS.google_roadmap;
        const initialLayer = L.tileLayer(defaultLayerConfig.url, {
            maxZoom: defaultLayerConfig.maxZoom,
            subdomains: defaultLayerConfig.subdomains,
            attribution: defaultLayerConfig.attribution,
        }).addTo(map);

        currentLayerRef.current = initialLayer;

        // Custom Red Google Maps Style Marker
        const googlePinIcon = L.divIcon({
            className: 'custom-google-pin',
            html: `
                <div style="position: relative; width: 36px; height: 36px;">
                    <svg viewBox="0 0 24 24" width="36" height="36" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
                        <path fill="#EA4335" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.8" fill="#FFFFFF"/>
                    </svg>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36],
        });

        // Add Draggable Marker
        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: googlePinIcon,
        }).addTo(map);

        markerRef.current = marker;

        marker.bindPopup(`
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                <strong style="color: #0F172A;">Store Hub Location</strong><br/>
                <span style="color: #64748B;">Drag pin or click map to reposition.</span><br/>
                <span style="color: #EA4335; font-weight: 700;">${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}</span>
            </div>
        `);

        // Marker drag handler
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const lat = Number(pos.lat.toFixed(6));
            const lng = Number(pos.lng.toFixed(6));

            marker.setPopupContent(`
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                    <strong style="color: #0F172A;">Store Hub Location</strong><br/>
                    <span style="color: #64748B;">Drag pin or click map to reposition.</span><br/>
                    <span style="color: #EA4335; font-weight: 700;">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>
                </div>
            `);

            if (onChange) {
                onChange({ latitude: lat, longitude: lng });
            }
        });

        // Map click handler
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            const fixedLat = Number(lat.toFixed(6));
            const fixedLng = Number(lng.toFixed(6));

            marker.setLatLng([fixedLat, fixedLng]);
            marker.setPopupContent(`
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                    <strong style="color: #0F172A;">Store Hub Location</strong><br/>
                    <span style="color: #64748B;">Drag pin or click map to reposition.</span><br/>
                    <span style="color: #EA4335; font-weight: 700;">${fixedLat.toFixed(6)}, ${fixedLng.toFixed(6)}</span>
                </div>
            `);

            if (onChange) {
                onChange({ latitude: fixedLat, longitude: fixedLng });
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
            currentLayerRef.current = null;
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

    // Geocode / Search address or coordinates
    const handleSearchLocation = async (e) => {
        if (e) e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setSearchError('');
        setIsSearching(true);

        try {
            // Check if user entered direct lat, lng coordinates (e.g. "14.2802, 74.4439")
            const coordMatch = query.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
            if (coordMatch) {
                const searchLat = Number(parseFloat(coordMatch[1]).toFixed(6));
                const searchLng = Number(parseFloat(coordMatch[2]).toFixed(6));

                if (mapInstanceRef.current && markerRef.current) {
                    markerRef.current.setLatLng([searchLat, searchLng]);
                    mapInstanceRef.current.flyTo([searchLat, searchLng], 15);
                }
                if (onChange) {
                    onChange({ latitude: searchLat, longitude: searchLng });
                }
                setIsSearching(false);
                return;
            }

            // Fallback to OpenStreetMap Nominatim Search API
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                { headers: { 'Accept-Language': 'en' } }
            );

            if (!response.ok) throw new Error('Search request failed');

            const results = await response.json();
            if (results && results.length > 0) {
                const targetLat = Number(parseFloat(results[0].lat).toFixed(6));
                const targetLng = Number(parseFloat(results[0].lon).toFixed(6));

                if (mapInstanceRef.current && markerRef.current) {
                    markerRef.current.setLatLng([targetLat, targetLng]);
                    mapInstanceRef.current.flyTo([targetLat, targetLng], 15);
                }
                if (onChange) {
                    onChange({ latitude: targetLat, longitude: targetLng });
                }
            } else {
                setSearchError('Location not found. Try entering city name or coordinates.');
            }
        } catch (err) {
            setSearchError('Unable to search location. Please check your network.');
        } finally {
            setIsSearching(false);
        }
    };

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
                    mapInstanceRef.current.flyTo([lat, lng], 16);
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

    const googleMapsWebUrl = `https://www.google.com/maps?q=${Number(latitude) || initialLat},${Number(longitude) || initialLng}`;

    return (
        <Box sx={{ width: '100%' }}>
            {/* Top Toolbar: Search + Layer Selector */}
            <Stack spacing={1.5} sx={{ mb: 1.5 }}>
                {/* Search Bar & GPS Locate */}
                <Box component="form" onSubmit={handleSearchLocation} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search landmark, town, or coordinates (e.g. Honnavar Port)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        error={Boolean(searchError)}
                        helperText={searchError}
                        InputProps={{
                            startIcon: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5, mr: 0.5 }} />,
                            endAdornment: isSearching ? (
                                <CircularProgress size={18} sx={{ color: '#EA4335' }} />
                            ) : null,
                            sx: { borderRadius: 2, fontSize: '0.84rem' },
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSearching}
                        sx={{
                            textTransform: 'none',
                            bgcolor: '#EA4335',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            borderRadius: 2,
                            px: 2,
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: '#D93025' },
                        }}
                    >
                        Find
                    </Button>
                    <Tooltip title="Pin My Current GPS Location">
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleLocateMe}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                minWidth: 42,
                                px: 1.2,
                                borderColor: 'divider',
                            }}
                        >
                            <MyLocationIcon fontSize="small" sx={{ color: '#0284C7' }} />
                        </Button>
                    </Tooltip>
                </Box>

                {/* Layer Switcher & Presets */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
                    {/* Layer Switcher */}
                    <ToggleButtonGroup
                        size="small"
                        value={activeLayer}
                        exclusive
                        onChange={(_, newLayer) => {
                            if (newLayer) switchLayer(newLayer);
                        }}
                        sx={{
                            bgcolor: 'background.paper',
                            '& .MuiToggleButton-root': {
                                px: 1.2,
                                py: 0.4,
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                gap: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: '#FEF2F2',
                                    color: '#DC2626',
                                    borderColor: '#DC2626',
                                },
                            },
                        }}
                    >
                        <ToggleButton value="google_roadmap">
                            <MapIcon sx={{ fontSize: 15, color: '#EA4335' }} />
                            Google Maps
                        </ToggleButton>
                        <ToggleButton value="google_hybrid">
                            <SatelliteIcon sx={{ fontSize: 15, color: '#0284C7' }} />
                            Satellite
                        </ToggleButton>
                        <ToggleButton value="google_terrain">
                            <TerrainIcon sx={{ fontSize: 15, color: '#16A34A' }} />
                            Terrain
                        </ToggleButton>
                        <ToggleButton value="osm">
                            <PublicIcon sx={{ fontSize: 15, color: '#64748B' }} />
                            OSM
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Open in Google Maps Link */}
                    <Button
                        size="small"
                        component="a"
                        href={googleMapsWebUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#EA4335',
                            p: 0,
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                        }}
                    >
                        Verify on Google Maps
                    </Button>
                </Box>

                {/* Hub Presets */}
                <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        Coastal Hubs:
                    </Typography>
                    {CITY_PRESETS.map((city) => (
                        <Chip
                            key={city.name}
                            label={city.name}
                            size="small"
                            onClick={() => handleCityPreset(city.lat, city.lng)}
                            sx={{
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.72rem',
                                height: 22,
                                '&:hover': { bgcolor: '#FEF2F2', color: '#DC2626', borderColor: '#DC2626' },
                            }}
                        />
                    ))}
                </Stack>
            </Stack>

            {/* Map Canvas */}
            <Paper
                elevation={0}
                sx={{
                    height,
                    width: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: activeLayer.startsWith('google') ? 'rgba(234, 67, 53, 0.4)' : 'divider',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
            >
                <div ref={mapContainerRef} style={{ height: '100%', width: '100%', minHeight: height }} />
            </Paper>

            {/* Coordinate Status Bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mt: 1,
                    px: 1.5,
                    py: 0.8,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    gap: 0.5,
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <PlaceIcon sx={{ fontSize: 18, color: '#EA4335' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Selected Pin: {Number(latitude) ? Number(latitude).toFixed(6) : '—'}, {Number(longitude) ? Number(longitude).toFixed(6) : '—'}
                    </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Powered by {MAP_LAYERS[activeLayer]?.name || 'Google Maps'}
                </Typography>
            </Box>
        </Box>
    );
}
