import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Stack, Table, TableHead, TableRow, TableCell,
    TableBody, TableContainer, Chip, Button, MenuItem, TextField } from '@mui/material';
import AdminLayout from '../../../Layouts/AdminLayout';

function ProposalAction({ enquiry, proposalItems = [] }) {
    const [open, setOpen] = useState(false);
    const [itemId, setItemId] = useState('');
    const [total, setTotal] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    if (enquiry.proposal) {
        return <Typography variant="caption">Proposal {enquiry.proposal.booking_number} ({enquiry.proposal.hold_expired ? 'hold expired — not reserved' : enquiry.proposal.status})</Typography>;
    }
    if (!['requested', 'reviewing'].includes(enquiry.status)) return null;
    const eligibleItems = proposalItems.filter(item => item.service_type === enquiry.service_type);
    const submit = () => {
        const amount = Number(total);
        if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(Number(itemId)) || Number(itemId) <= 0 || notes.trim().length < 5) {
            setError('Enter a valid item ID, reviewed total in paise, and notes (at least 5 characters).');
            return;
        }
        setError('');
        setBusy(true);
        router.post(`/admin/service-enquiries/${enquiry.id}/proposal`, {
            service_item_id: Number(itemId), reviewed_total_paise: amount, review_notes: notes
        }, { preserveScroll: true, onError: errors => setError(Object.values(errors).join(' ') || 'Proposal creation failed.'), onFinish: () => setBusy(false) });
    };
    return <Stack spacing={1} sx={{ mt: 1, minWidth: 210 }}>
        <Button size="small" variant="outlined" onClick={() => setOpen(!open)}>Create unpaid proposal</Button>
        {open && <>
            <TextField size="small" select label="Available service item / branch" value={itemId} onChange={e => setItemId(e.target.value)} helperText="Choose inventory assigned to an active branch">
                {eligibleItems.map(item => <MenuItem key={item.id} value={String(item.id)}>{item.name} — Branch #{item.store_id}</MenuItem>)}
            </TextField>
            {!eligibleItems.length && <Typography variant="caption" color="error">No eligible inventory found for this service.</Typography>}
            <TextField size="small" label="Reviewed total (paise)" value={total} onChange={e => setTotal(e.target.value)} helperText="10000 paise = ₹100; no tariff is calculated" />
            <TextField size="small" multiline minRows={2} label="Manual price review notes" value={notes} onChange={e => setNotes(e.target.value)} />
            {error && <Typography color="error" variant="caption">{error}</Typography>}
            <Button size="small" disabled={busy} onClick={submit}>Create 10-minute hold</Button>
        </>}
    </Stack>;
}

export default function ServiceEnquiriesIndex({ enquiries = { data: [], links: [] }, proposalItems = [] }) {
    const [statusErrors, setStatusErrors] = useState({});
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
                        <TableCell>Status / Proposal</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {(enquiries.data || []).map((e) => <TableRow key={e.id}>
                            <TableCell><Typography fontWeight={700}>{e.reference}</Typography>{e.service_type}</TableCell>
                            <TableCell>{e.customer_name}<Typography variant="body2">{e.customer_phone}</Typography>
                                <Typography color="text.secondary" variant="caption">{e.customer_email}</Typography></TableCell>
                            <TableCell>{e.start_datetime}<Typography variant="body2">{e.pickup_location}</Typography>
                                <Typography variant="caption">{e.drop_location}</Typography></TableCell>
                            <TableCell>Qty: {e.quantity}<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxWidth: 280 }}>{e.customer_notes}</Typography></TableCell>
                            <TableCell>
                            <Chip size="small" label={`${e.status === 'reviewing' ? 'Under review' : e.status === 'closed' ? 'Closed' : e.status === 'cancelled' ? 'Cancelled' : 'Requested'} — unconfirmed`} />
                            <TextField size="small" select fullWidth value={e.status} sx={{ mt: 1, minWidth: 145 }}
                                onChange={(event) => router.post(`/admin/service-enquiries/${e.id}/status`,
                                    { status: event.target.value }, { preserveScroll: true,
                                        onError: errors => setStatusErrors(previous => ({ ...previous, [e.id]: Object.values(errors).join(' ') || 'Status update rejected.' })),
                                        onSuccess: () => setStatusErrors(previous => ({ ...previous, [e.id]: '' })) })}>
                                {['requested', 'reviewing', 'closed', 'cancelled'].map((status) =>
                                    <MenuItem key={status} value={status}
                                        disabled={(['closed', 'cancelled'].includes(e.status) && e.status !== status) ||
                                            (['closed', 'cancelled'].includes(status) && e.proposal &&
                                                (['confirmed', 'in_progress'].includes(e.proposal.status) ||
                                                    (e.proposal.status === 'held' && !e.proposal.hold_expired)))}>
                                        {status.replace('_', ' ')}
                                    </MenuItem>)}
                            </TextField>
                            {statusErrors[e.id] && <Typography variant="caption" color="error">{statusErrors[e.id]}</Typography>}
                            <ProposalAction enquiry={e} proposalItems={proposalItems} />
                        </TableCell>
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
