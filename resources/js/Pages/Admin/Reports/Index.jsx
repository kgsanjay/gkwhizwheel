import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Tabs,
    Tab,
    Button,
    ButtonGroup,
    TextField,
    MenuItem,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Stack,
    useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AssessmentIcon from '@mui/icons-material/Assessment';

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

export default function ReportsIndex({
    revenue_stats = {},
    utilization_stats = {},
    stores = [],
    filters = {},
}) {
    const muiTheme = useTheme();
    const isDark = muiTheme.palette.mode === 'dark';
    const chartTooltipStyle = {
        backgroundColor: isDark ? muiTheme.palette.background.paper : '#0F172A',
        color: isDark ? muiTheme.palette.text.primary : '#FFF',
        borderRadius: 8,
        border: `1px solid ${muiTheme.palette.divider}`,
    };
    const axisStroke = muiTheme.palette.text.secondary;
    const gridStroke = muiTheme.palette.divider;
    const [tabIndex, setTabIndex] = useState(0);
    const [timeframe, setTimeframe] = useState(filters.timeframe || '30d');
    const [selectedStore, setSelectedStore] = useState(filters.store_id || '');

    const handleFilterChange = (newTimeframe, newStore) => {
        const tf = newTimeframe !== undefined ? newTimeframe : timeframe;
        const st = newStore !== undefined ? newStore : selectedStore;

        router.get('/admin/reports', {
            timeframe: tf,
            store_id: st || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

    return (
        <AdminLayout title="Reports & Performance Analytics">
            <Head title="Reports & Analytics - Admin" />

            {/* Top Controls Bar */}
            <Card sx={{ mb: 3, p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Executive Performance Reporting
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Period: {filters.from} to {filters.to}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Filter Controls */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            select
                            size="small"
                            label="Filter Hub"
                            value={selectedStore}
                            onChange={(e) => {
                                setSelectedStore(e.target.value);
                                handleFilterChange(undefined, e.target.value);
                            }}
                            sx={{ minWidth: 160 }}
                        >
                            <MenuItem value="">All Hub Locations</MenuItem>
                            {stores.map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name} {s.city ? `(${s.city})` : ''}
                                </MenuItem>
                            ))}
                        </TextField>

                        <ButtonGroup size="small" variant="outlined">
                            {[
                                { key: '7d', label: '7 Days' },
                                { key: '30d', label: '30 Days' },
                                { key: 'month', label: 'This Month' },
                                { key: 'year', label: 'This Year' },
                            ].map((tf) => (
                                <Button
                                    key={tf.key}
                                    variant={timeframe === tf.key ? 'contained' : 'outlined'}
                                    onClick={() => {
                                        setTimeframe(tf.key);
                                        handleFilterChange(tf.key, undefined);
                                    }}
                                >
                                    {tf.label}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Tabs Switcher */}
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
                    <Tab label="Revenue & Financials" icon={<TrendingUpIcon />} iconPosition="start" />
                    <Tab label="Fleet Utilization" icon={<TwoWheelerIcon />} iconPosition="start" />
                </Tabs>
            </Card>

            {/* ========================================================================= */}
            {/* TAB 0: REVENUE REPORT */}
            {/* ========================================================================= */}
            {tabIndex === 0 && (
                <Stack spacing={3}>
                    {/* Financial KPI Cards */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        GROSS REVENUE
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="primary.main">
                                        {formatCurrency(revenue_stats.gross_revenue)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        NET REVENUE
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="success.main">
                                        {formatCurrency(revenue_stats.net_revenue)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        RENTAL FEES
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="info.main">
                                        {formatCurrency(revenue_stats.rental_collected)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        DEPOSITS COLLECTED
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="secondary.main">
                                        {formatCurrency(revenue_stats.deposit_collected)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        REFUNDS ISSUED
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="error.main">
                                        {formatCurrency(revenue_stats.refunds_issued)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Daily Revenue Timeline Chart */}
                    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                            Daily Revenue & Income Timeline (₹)
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenue_stats.timeline || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1976D2" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#1976D2" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                    <XAxis dataKey="date" stroke={axisStroke} fontSize={12} />
                                    <YAxis stroke={axisStroke} fontSize={12} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val)}
                                        contentStyle={chartTooltipStyle}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#1976D2" strokeWidth={2} fillOpacity={1} fill="url(#colorGross)" />
                                    <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#2E7D32" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                                    <Area type="monotone" dataKey="refunds" name="Refunds Issued" stroke="#D32F2F" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>

                    {/* Breakdown Charts Grid */}
                    <Grid container spacing={3}>
                        {/* Revenue by Bike Category */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                    Revenue by Bike Category
                                </Typography>
                                <Box sx={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenue_stats.category_breakdown || []} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                                            <XAxis dataKey="category" stroke="#64748B" fontSize={11} angle={-20} textAnchor="end" />
                                            <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Bar dataKey="revenue" name="Revenue" fill="#1976D2" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Revenue by Store Hub */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                    Revenue by Store Hub
                                </Typography>
                                <Box sx={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenue_stats.store_breakdown || []} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                                            <XAxis dataKey="store" stroke="#64748B" fontSize={11} angle={-20} textAnchor="end" />
                                            <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Bar dataKey="revenue" name="Revenue" fill="#0288D1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Booking Channel Distribution */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                    Booking Channel Share
                                </Typography>
                                <Box sx={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={revenue_stats.channel_breakdown || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {(revenue_stats.channel_breakdown || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || '#1976D2'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Stack>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: FLEET UTILIZATION REPORT */}
            {/* ========================================================================= */}
            {tabIndex === 1 && (
                <Stack spacing={3}>
                    {/* Utilization KPI Cards */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        TOTAL FLEET SIZE
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="primary.main">
                                        {utilization_stats.total_fleet ?? 0} Bikes
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        OPERATIONAL FLEET
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="info.main">
                                        {utilization_stats.active_fleet ?? 0} Bikes
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        AVERAGE UTILIZATION
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="success.main">
                                        {utilization_stats.average_utilization ?? 0}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        TOTAL RENTAL DAYS
                                    </Typography>
                                    <Typography variant="h5" fontWeight={800} color="secondary.main">
                                        {utilization_stats.total_rented_days ?? 0} Days
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Fleet Utilization Timeline Line Chart */}
                    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                            Daily Fleet Utilization Rate (%)
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={utilization_stats.timeline || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                                    <XAxis dataKey="date" stroke={axisStroke} fontSize={12} />
                                    <YAxis domain={[0, 100]} stroke={axisStroke} fontSize={12} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip
                                        formatter={(val) => [`${val}%`, 'Utilization Rate']}
                                        contentStyle={chartTooltipStyle}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="utilization_rate"
                                        name="Utilization Rate"
                                        stroke="#ED6C02"
                                        strokeWidth={3}
                                        dot={{ r: 3, fill: '#ED6C02' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>

                    {/* Top Performing Bikes Table */}
                    <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <Box sx={{ p: 2.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Top Earning & Most Utilized Bikes
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Ranked by total revenue generated and rental days logged during the selected period
                            </Typography>
                        </Box>

                        <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 780 }}>
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}># Rank</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Bike Model & Reg</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Assigned Hub</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Days Rented</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="center">Utilization %</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }} align="right">Revenue Generated</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(!utilization_stats.top_bikes || utilization_stats.top_bikes.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary" variant="body2">
                                                    No bike rental activity logged during this timeframe.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        utilization_stats.top_bikes.map((bike, idx) => (
                                            <TableRow key={bike.id} hover>
                                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                                    #{idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {bike.model}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {bike.registration_number}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={bike.category || 'Standard'} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell>{bike.store || 'Main Hub'}</TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {bike.rental_days} Days
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        size="small"
                                                        label={`${bike.utilization_rate}%`}
                                                        color={bike.utilization_rate > 50 ? 'success' : bike.utilization_rate > 20 ? 'primary' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={700} color="primary.main">
                                                        {formatCurrency(bike.revenue)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Stack>
            )}
        </AdminLayout>
    );
}
