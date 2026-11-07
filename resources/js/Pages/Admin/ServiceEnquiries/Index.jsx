import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Stack, Table, TableHead, TableRow, TableCell,
    TableBody, TableContainer, Chip, Button } from '@mui/material';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function ServiceEnquiriesIndex({ enquiries = { data: [], links: [] } }) {
    return <AdminLayout title="Service Enquiries">
        <Head title="Service Enquiries | G.K. WhizWheel" />
        <Stack spacing={3}>
            <Box>
                <Typography variant="h4" fontWeight={800}>Service enquiries</Typography>
                <Typography color="text.secondary">
                    Requests from cab, boating, scuba, homestay, guide and tours customers.
                    No availability, price or payment is confirmed by receiving an enquiry.
                </Typography>
            </Box>
            <Card variant="outlined"><CardContent>
                <TableContainer><Table size="small">
                    <TableHead><TableRow>
                        <TableCell>Reference / Service</TableCell><TableCell>Customer</TableCell>
                        <TableCell>Date and location</TableCell><TableCell>Request</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {(enquiries.data || []).map((e) => <TableRow key={e.id}>
                            <TableCell><Typography fontWeight={700}>{e.reference}</Typography>{e.service_type}</TableCell>
                            <TableCell>{e.customer_name}<Typography variant="body2">{e.customer_phone}</Typography>
                                <Typography color="text.secondary" variant="caption">{e.customer_email}</Typography></TableCell>
                            <TableCell>{e.start_datetime}<Typography variant="body2">{e.pickup_location}</Typography>
                                <Typography variant="caption">{e.drop_location}</Typography></TableCell>
                            <TableCell>Qty: {e.quantity}<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxWidth: 280 }}>{e.customer_notes}</Typography></TableCell>
                            <TableCell><Chip label="Requested — unconfirmed" size="small" /></TableCell>
                        </TableRow>)}
                        {!(enquiries.data || []).length && <TableRow><TableCell colSpan={5}>
                            No enquiries received yet.</TableCell></TableRow>}
                    </TableBody>
                </Table></TableContainer>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    {(enquiries.links || []).filter((l) => l.url).map((l, i) =>
                        <Button key={i} component={Link} href={l.url} size="small"
                            variant={l.active ? 'contained' : 'outlined'}>{String(l.label).replace(/&laquo;|&raquo;/g, '')}</Button>)}
                </Stack>
            </CardContent></Card>
        </Stack>
    </AdminLayout>;
}
