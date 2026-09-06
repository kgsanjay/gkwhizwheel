import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { apiClient } from '../api/client.js';
import { generateIdempotencyKey } from '../api/idempotency.js';
import { enqueueAction } from '../storage/queue.js';
import CameraCapture from '../components/CameraCapture.js';

export const RETURN_STAGES = {
    SEARCH: 'search',
    INSPECTION: 'inspection',
    REFUND_REVIEW: 'refund_review',
    SUCCESS: 'success',
};

export default function ReturnFlowScreen({ onFinish, onCancel }) {
    const { currentStore, user } = useAuth();

    const [stage, setStage] = useState(RETURN_STAGES.SEARCH);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStoreOnly, setFilterStoreOnly] = useState(false);
    const [activeBookings, setActiveBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Return Inspection Inputs
    const [returnOdometer, setReturnOdometer] = useState('');
    const [returnPhotos, setReturnPhotos] = useState([]);
    const [damageNotes, setDamageNotes] = useState('');
    const [damageFee, setDamageFee] = useState('0');

    // Checklist toggles
    const [checklist, setChecklist] = useState({
        lightsWorking: true,
        mirrorsIntact: true,
        tiresIntact: true,
        fuelMatched: true,
        helmetReturned: true,
    });

    // Late Fee & Deposit Refund
    const [lateFeeOverride, setLateFeeOverride] = useState('');
    const [refundMethod, setRefundMethod] = useState('cash'); // 'cash' | 'upi' | 'card'
    const [processedResult, setProcessedResult] = useState(null);

    // ------------------------------------------------------------------
    // Fetch Active Bookings (Searchable by phone, bike, ref, name)
    // ------------------------------------------------------------------
    const fetchActiveBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            let url = `/staff/bookings/active?search=${encodeURIComponent(searchQuery.trim())}`;
            if (filterStoreOnly && currentStore?.id) {
                url += `&store_id=${currentStore.id}`;
            }

            const res = await apiClient.get(url);
            const data = res?.data || res || [];
            const list = Array.isArray(data) ? data : data.data || [];
            setActiveBookings(list);
        } catch {
            // Offline fallback mock active bookings
            const mockList = [
                {
                    id: 101,
                    booking_reference: 'GW-20260905-101',
                    status: 'handed_over',
                    start_date: '2026-09-04',
                    end_date: '2026-09-06',
                    deposit_amount: 2000,
                    pickup_store: { id: 1, name: 'Indiranagar Store' },
                    return_store: { id: 1, name: 'Indiranagar Store' },
                    user: { name: 'Vikram Mehta', phone: '+919876543210' },
                    bike: {
                        brand: 'Royal Enfield',
                        model: 'Hunter 350',
                        registration_number: 'KA-01-EQ-1234',
                        base_daily_rate: 850,
                    },
                    condition_logs: [
                        {
                            stage: 'handover',
                            odometer_reading: 14200,
                            notes: 'Minor scratch on left exhaust shield.',
                            photos: [{ id: 1, photo_path: 'handover_dl.jpg' }],
                        },
                    ],
                },
                {
                    id: 102,
                    booking_reference: 'GW-20260904-102',
                    status: 'handed_over',
                    start_date: '2026-09-03',
                    end_date: '2026-09-05', // 1 day overdue
                    deposit_amount: 1500,
                    pickup_store: { id: 2, name: 'Koramangala Store' },
                    return_store: { id: 1, name: 'Indiranagar Store' },
                    user: { name: 'Ananya Sharma', phone: '+919111122222' },
                    bike: {
                        brand: 'Honda',
                        model: 'Activa 6G',
                        registration_number: 'KA-04-AB-5678',
                        base_daily_rate: 450,
                    },
                    condition_logs: [
                        {
                            stage: 'handover',
                            odometer_reading: 9800,
                            notes: 'Clean handover. No preexisting marks.',
                            photos: [{ id: 2, photo_path: 'handover_activa.jpg' }],
                        },
                    ],
                },
            ];

            const filtered = mockList.filter((b) => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                    b.booking_reference.toLowerCase().includes(q) ||
                    b.user?.phone?.includes(q) ||
                    b.user?.name?.toLowerCase().includes(q) ||
                    b.bike?.registration_number?.toLowerCase().includes(q)
                );
            });
            setActiveBookings(filtered);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterStoreOnly, currentStore]);

    useEffect(() => {
        fetchActiveBookings();
    }, [fetchActiveBookings]);

    // Extract handover condition baseline
    const handoverLog = useMemo(() => {
        if (!selectedBooking?.condition_logs) return null;
        return selectedBooking.condition_logs.find((l) => l.stage === 'handover');
    }, [selectedBooking]);

    const handoverOdometer = handoverLog?.odometer_reading || 0;

    // ------------------------------------------------------------------
    // Calculate Late Fees & Net Deposit Refund
    // ------------------------------------------------------------------
    const calculation = useMemo(() => {
        if (!selectedBooking) return { overdueDays: 0, autoLateFee: 0, finalLateFee: 0, damage: 0, deposit: 0, netRefund: 0 };

        const scheduledEnd = new Date(selectedBooking.end_date + 'T23:59:59');
        const now = new Date();
        const dailyRate = Number(selectedBooking.bike?.base_daily_rate || 500);

        let overdueDays = 0;
        let autoLateFee = 0;

        if (now > scheduledEnd) {
            const diffMs = now - scheduledEnd;
            overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            autoLateFee = overdueDays * dailyRate;
        }

        const finalLateFee = lateFeeOverride !== '' ? Math.max(0, parseFloat(lateFeeOverride) || 0) : autoLateFee;
        const damage = Math.max(0, parseFloat(damageFee) || 0);
        const deposit = Number(selectedBooking.deposit_amount || 0);
        const netRefund = Math.max(0, deposit - finalLateFee - damage);

        return {
            overdueDays,
            autoLateFee,
            finalLateFee,
            damage,
            deposit,
            netRefund,
        };
    }, [selectedBooking, lateFeeOverride, damageFee]);

    // ------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------
    const handleSelectBooking = (item) => {
        setSelectedBooking(item);
        setReturnOdometer(String(item.condition_logs?.[0]?.odometer_reading ? item.condition_logs[0].odometer_reading + 45 : ''));
        setDamageFee('0');
        setDamageNotes('');
        setLateFeeOverride('');
        setStage(RETURN_STAGES.INSPECTION);
    };

    const handleProceedToRefund = () => {
        const odo = parseInt(returnOdometer.trim(), 10);
        if (isNaN(odo) || odo <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid return odometer reading.');
            return;
        }

        if (handoverOdometer > 0 && odo < handoverOdometer) {
            Alert.alert(
                'Invalid Odometer',
                `Return odometer (${odo} km) cannot be less than handover odometer (${handoverOdometer} km).`
            );
            return;
        }

        setStage(RETURN_STAGES.REFUND_REVIEW);
    };

    const handleSubmitReturn = async () => {
        setIsLoading(true);
        const idempotencyKey = generateIdempotencyKey();

        const returnPayload = {
            booking_id: selectedBooking.id,
            odometer_reading: parseInt(returnOdometer.trim(), 10),
            late_fee_override: calculation.finalLateFee,
            damage_fee: calculation.damage,
            deposit_refund_amount: calculation.netRefund,
            return_store_id: currentStore?.id || selectedBooking.return_store_id,
            notes: damageNotes || 'Return inspection completed. No major issues.',
            condition_photos: returnPhotos.map((p) => p.name || 'return_photo.jpg'),
            refund_method: refundMethod,
        };

        try {
            let resData = null;
            try {
                const res = await apiClient.post(`/staff/bookings/${selectedBooking.id}/return`, returnPayload);
                resData = res?.data || res;
            } catch {
                // Offline resilience fallback
                await enqueueAction({
                    actionType: 'return',
                    endpoint: `/staff/bookings/${selectedBooking.id}/return`,
                    payload: returnPayload,
                    idempotencyKey,
                });
                resData = {
                    booking_reference: selectedBooking.booking_reference,
                    status: 'returned',
                    is_offline: true,
                };
            }

            setProcessedResult(resData);
            setStage(RETURN_STAGES.SUCCESS);
        } catch (err) {
            Alert.alert('Return Failed', err.message || 'Could not process return.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => {
                            if (stage === RETURN_STAGES.SEARCH) {
                                onCancel();
                            } else if (stage === RETURN_STAGES.INSPECTION) {
                                setStage(RETURN_STAGES.SEARCH);
                            } else if (stage === RETURN_STAGES.REFUND_REVIEW) {
                                setStage(RETURN_STAGES.INSPECTION);
                            }
                        }}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Process Bike Return</Text>
                    <Text style={styles.storeBadgeText}>{currentStore?.name}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ------------------------------------------------------------- */}
                {/* STAGE 1: SEARCH ACTIVE BOOKINGS */}
                {/* ------------------------------------------------------------- */}
                {stage === RETURN_STAGES.SEARCH && (
                    <View>
                        <View style={styles.searchCard}>
                            <Text style={styles.sectionTitle}>Search Active Outgoing Rentals</Text>
                            <Text style={styles.sectionSubtitle}>
                                Search by customer phone number, name, bike plate, or booking reference.
                            </Text>

                            <View style={styles.searchRow}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="e.g. 9876543210, KA-01, or Vikram"
                                    placeholderTextColor="#94a3b8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={fetchActiveBookings}
                                />
                                <TouchableOpacity style={styles.searchBtn} onPress={fetchActiveBookings}>
                                    <Text style={styles.searchBtnText}>Search</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.filterRow}>
                                <TouchableOpacity
                                    style={[styles.filterChip, !filterStoreOnly && styles.filterChipActive]}
                                    onPress={() => setFilterStoreOnly(false)}
                                >
                                    <Text style={[styles.filterChipText, !filterStoreOnly && styles.filterChipTextActive]}>
                                        All Stores (System-wide)
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.filterChip, filterStoreOnly && styles.filterChipActive]}
                                    onPress={() => setFilterStoreOnly(true)}
                                >
                                    <Text style={[styles.filterChipText, filterStoreOnly && styles.filterChipTextActive]}>
                                        This Store Only ({currentStore?.name})
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Active Booking Cards */}
                        <Text style={styles.listHeading}>
                            Active Rentals ({activeBookings.length})
                        </Text>

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 24 }} />
                        ) : activeBookings.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>No Matching Active Rentals</Text>
                                <Text style={styles.emptySubtitle}>
                                    No bikes currently marked 'Handed Over' match your query.
                                </Text>
                            </View>
                        ) : (
                            activeBookings.map((b) => (
                                <View key={b.id} style={styles.bookingCard}>
                                    <View style={styles.bookingCardHeader}>
                                        <Text style={styles.refText}>{b.booking_reference}</Text>
                                        <View style={styles.handedOverBadge}>
                                            <Text style={styles.handedOverBadgeText}>ON RENT</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.customerName}>
                                        👤 {b.user?.name}{' '}
                                        <Text style={styles.customerPhone}>({b.user?.phone})</Text>
                                    </Text>

                                    <Text style={styles.bikeInfo}>
                                        🏍️ {b.bike?.brand} {b.bike?.model} •{' '}
                                        <Text style={styles.plate}>{b.bike?.registration_number}</Text>
                                    </Text>

                                    <View style={styles.dateRow}>
                                        <Text style={styles.dateLabel}>
                                            Scheduled Return:{' '}
                                            <Text style={styles.dateValue}>{b.end_date}</Text>
                                        </Text>
                                        <Text style={styles.depositLabel}>
                                            Deposit: ₹{b.deposit_amount}
                                        </Text>
                                    </View>

                                    {new Date(b.end_date + 'T23:59:59') < new Date() && (
                                        <View style={styles.overdueAlert}>
                                            <Text style={styles.overdueAlertText}>
                                                ⚠️ Overdue Return — Late fee applies
                                            </Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.processReturnBtn}
                                        onPress={() => handleSelectBooking(b)}
                                    >
                                        <Text style={styles.processReturnBtnText}>
                                            Start Return Inspection →
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STAGE 2: CONDITION CHECKLIST & HANDOVER PHOTO COMPARISON */}
                {/* ------------------------------------------------------------- */}
                {stage === RETURN_STAGES.INSPECTION && selectedBooking && (
                    <View>
                        {/* Summary Header */}
                        <View style={styles.selectedBanner}>
                            <Text style={styles.selectedBannerTitle}>
                                Returning: {selectedBooking.bike?.brand} {selectedBooking.bike?.model}
                            </Text>
                            <Text style={styles.selectedBannerSub}>
                                Ref: {selectedBooking.booking_reference} • Customer: {selectedBooking.user?.name}
                            </Text>
                        </View>

                        {/* Handover Baseline Photo & Condition Card */}
                        <View style={styles.baselineCard}>
                            <View style={styles.baselineHeader}>
                                <Text style={styles.baselineTitle}>📸 Handover Baseline (Comparison)</Text>
                                <View style={styles.baselineTag}>
                                    <Text style={styles.baselineTagText}>PICKUP RECORD</Text>
                                </View>
                            </View>

                            <View style={styles.baselineInfoRow}>
                                <Text style={styles.baselineOdo}>
                                    Handover Odometer:{' '}
                                    <Text style={{ fontWeight: 'bold' }}>{handoverOdometer} km</Text>
                                </Text>
                            </View>

                            <Text style={styles.baselineNotes}>
                                Notes: {handoverLog?.notes || 'No pre-existing damages noted at handover.'}
                            </Text>

                            {/* Handover Photos Display */}
                            <Text style={styles.photoHeading}>Handover Baseline Photos:</Text>
                            <View style={styles.baselinePhotosRow}>
                                {handoverLog?.photos && handoverLog.photos.length > 0 ? (
                                    handoverLog.photos.map((p, idx) => (
                                        <View key={p.id || idx} style={styles.baselinePhotoCard}>
                                            <Text style={styles.baselinePhotoIcon}>📷</Text>
                                            <Text style={styles.baselinePhotoText}>Handover #{idx + 1}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.baselinePhotoCard}>
                                        <Text style={styles.baselinePhotoIcon}>📷</Text>
                                        <Text style={styles.baselinePhotoText}>Odometer Baseline</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Return Inspection Inputs */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Current Return Inspection</Text>
                            <Text style={styles.sectionSubtitle}>
                                Verify bike condition against handover photos and check for new damages.
                            </Text>

                            <Text style={styles.label}>
                                Return Odometer Reading (KM) * (Must be ≥ {handoverOdometer})
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder={`e.g. ${handoverOdometer + 45}`}
                                placeholderTextColor="#94a3b8"
                                value={returnOdometer}
                                onChangeText={setReturnOdometer}
                                keyboardType="number-pad"
                            />

                            {/* Return Condition Photos via CameraCapture */}
                            <CameraCapture
                                title="Capture Return Condition Photos"
                                label="Take Photo of Odometer & Return Condition"
                                photos={returnPhotos}
                                onPhotosChange={setReturnPhotos}
                                maxPhotos={4}
                                required
                            />

                            {/* Checklist Toggle Items */}
                            <Text style={[styles.label, { marginTop: 12 }]}>Return Checklist</Text>
                            <View style={styles.checklistGrid}>
                                {[
                                    { key: 'lightsWorking', label: 'Headlight & Taillight functional' },
                                    { key: 'mirrorsIntact', label: 'Mirrors undamaged' },
                                    { key: 'tiresIntact', label: 'Tires in good condition' },
                                    { key: 'fuelMatched', label: 'Fuel level matched' },
                                    { key: 'helmetReturned', label: 'Helmet returned' },
                                ].map((item) => {
                                    const checked = checklist[item.key];
                                    return (
                                        <TouchableOpacity
                                            key={item.key}
                                            style={[styles.checkItem, checked && styles.checkItemChecked]}
                                            onPress={() =>
                                                setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                                            }
                                        >
                                            <Text style={styles.checkIcon}>{checked ? '☑' : '☐'}</Text>
                                            <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.label, { marginTop: 14 }]}>Damage Deduction Fee (₹)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#94a3b8"
                                value={damageFee}
                                onChangeText={setDamageFee}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Damage Notes / Return Observations</Text>
                            <TextInput
                                style={[styles.input, { height: 60 }]}
                                placeholder="Describe any new scratch, dent, or missing accessories..."
                                placeholderTextColor="#94a3b8"
                                value={damageNotes}
                                onChangeText={setDamageNotes}
                                multiline
                            />

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={handleProceedToRefund}
                            >
                                <Text style={styles.primaryBtnText}>
                                    Calculate Late Fee & Deposit Refund →
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STAGE 3: LATE FEE CALCULATION & DEPOSIT REFUND */}
                {/* ------------------------------------------------------------- */}
                {stage === RETURN_STAGES.REFUND_REVIEW && selectedBooking && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Step 3: Late Fee & Deposit Settlement</Text>
                        <Text style={styles.sectionSubtitle}>
                            Review deposit deductions and record customer payout.
                        </Text>

                        {/* Late Fee Calculation Box */}
                        <View style={styles.lateFeeBox}>
                            <Text style={styles.lateFeeHeading}>Rental Schedule & Late Fee</Text>
                            <Text style={styles.lateFeeText}>
                                Scheduled End: {selectedBooking.end_date}
                            </Text>
                            {calculation.overdueDays > 0 ? (
                                <View style={styles.overdueBadgeRow}>
                                    <Text style={styles.overdueWarnText}>
                                        ⚠️ Overdue by {calculation.overdueDays} Day(s) @ ₹
                                        {selectedBooking.bike?.base_daily_rate}/day
                                    </Text>
                                    <Text style={styles.overdueAmount}>
                                        Calculated Late Fee: ₹{calculation.autoLateFee}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.onTimeText}>
                                    ✓ Returned On-Time (No automated late fee)
                                </Text>
                            )}

                            <Text style={[styles.label, { marginTop: 10 }]}>
                                Late Fee Override / Adjustment (₹)
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder={String(calculation.autoLateFee)}
                                placeholderTextColor="#94a3b8"
                                value={lateFeeOverride}
                                onChangeText={setLateFeeOverride}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Deposit Refund Calculation Breakdown */}
                        <View style={styles.settlementBox}>
                            <Text style={styles.settlementTitle}>Security Deposit Settlement</Text>

                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Original Security Deposit</Text>
                                <Text style={styles.breakdownVal}>₹{calculation.deposit}</Text>
                            </View>

                            <View style={styles.breakdownRow}>
                                <Text style={[styles.breakdownLabel, { color: '#dc2626' }]}>
                                    Less: Late Fee Deduction
                                </Text>
                                <Text style={[styles.breakdownVal, { color: '#dc2626' }]}>
                                    -₹{calculation.finalLateFee}
                                </Text>
                            </View>

                            <View style={styles.breakdownRow}>
                                <Text style={[styles.breakdownLabel, { color: '#dc2626' }]}>
                                    Less: Damage Fee Deduction
                                </Text>
                                <Text style={[styles.breakdownVal, { color: '#dc2626' }]}>
                                    -₹{calculation.damage}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.netRefundRow}>
                                <Text style={styles.netRefundLabel}>NET REFUND TO CUSTOMER</Text>
                                <Text style={styles.netRefundAmount}>₹{calculation.netRefund}</Text>
                            </View>
                        </View>

                        {/* Payout Method */}
                        <Text style={styles.label}>Refund Payment Method</Text>
                        <View style={styles.payoutMethodRow}>
                            {['cash', 'upi', 'card'].map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    style={[
                                        styles.payoutChip,
                                        refundMethod === method && styles.payoutChipActive,
                                    ]}
                                    onPress={() => setRefundMethod(method)}
                                >
                                    <Text
                                        style={[
                                            styles.payoutChipText,
                                            refundMethod === method && styles.payoutChipTextActive,
                                        ]}
                                    >
                                        {method.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.successBtn, isLoading && styles.btnDisabled]}
                            onPress={handleSubmitReturn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.successBtnText}>
                                    Complete Return & Refund (₹{calculation.netRefund})
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STAGE 4: SUCCESS SUMMARY */}
                {/* ------------------------------------------------------------- */}
                {stage === RETURN_STAGES.SUCCESS && (
                    <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successHeading}>Bike Returned Successfully!</Text>
                        <Text style={styles.successSubtitle}>
                            Bike is now checked in and available at {currentStore?.name}.
                        </Text>

                        <View style={styles.receiptBox}>
                            <Text style={styles.receiptItem}>
                                Ref: {selectedBooking?.booking_reference}
                            </Text>
                            <Text style={styles.receiptItem}>
                                Customer: {selectedBooking?.user?.name}
                            </Text>
                            <Text style={styles.receiptItem}>
                                Final Odometer: {returnOdometer} km
                            </Text>
                            <Text style={styles.receiptItem}>
                                Late Fee: ₹{calculation.finalLateFee} • Damage Fee: ₹
                                {calculation.damage}
                            </Text>
                            <Text style={[styles.receiptItem, { fontWeight: 'bold', color: '#059669' }]}>
                                Deposit Refunded: ₹{calculation.netRefund} ({refundMethod.toUpperCase()})
                            </Text>
                            {processedResult?.is_offline && (
                                <View style={styles.offlineSummaryBadge}>
                                    <Text style={styles.offlineSummaryBadgeText}>
                                        ⏳ PENDING SYNC — Return saved in local SQLite. Will auto-sync when online.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => {
                                setStage(RETURN_STAGES.SEARCH);
                                setSelectedBooking(null);
                                setSearchQuery('');
                                fetchActiveBookings();
                                if (onFinish) onFinish();
                            }}
                        >
                            <Text style={styles.primaryBtnText}>Process Another Return</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel}>
                            <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        backgroundColor: '#0f172a',
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    backBtnText: {
        color: '#38bdf8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    storeBadgeText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    scrollContent: {
        padding: 16,
    },
    searchCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#f8fafc',
    },
    searchBtn: {
        backgroundColor: '#0284c7',
        borderRadius: 6,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 13,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    filterChip: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    filterChipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    filterChipText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    listHeading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    bookingCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bookingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    refText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    handedOverBadge: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    handedOverBadgeText: {
        color: '#0369a1',
        fontSize: 10,
        fontWeight: 'bold',
    },
    customerName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 4,
    },
    customerPhone: {
        color: '#64748b',
        fontWeight: 'normal',
    },
    bikeInfo: {
        fontSize: 13,
        color: '#334155',
        marginTop: 2,
    },
    plate: {
        fontWeight: 'bold',
        color: '#0284c7',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
    },
    dateLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    dateValue: {
        fontWeight: '600',
        color: '#0f172a',
    },
    depositLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#059669',
    },
    overdueAlert: {
        backgroundColor: '#fef2f2',
        padding: 6,
        borderRadius: 4,
        marginTop: 8,
    },
    overdueAlertText: {
        color: '#b91c1c',
        fontSize: 11,
        fontWeight: 'bold',
    },
    processReturnBtn: {
        backgroundColor: '#0284c7',
        borderRadius: 6,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    processReturnBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 24,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#334155',
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    selectedBanner: {
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 14,
    },
    selectedBannerTitle: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    selectedBannerSub: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 2,
    },
    baselineCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    baselineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    baselineTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    baselineTag: {
        backgroundColor: '#334155',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    baselineTagText: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    baselineInfoRow: {
        marginVertical: 4,
    },
    baselineOdo: {
        fontSize: 13,
        color: '#334155',
    },
    baselineNotes: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    photoHeading: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
    },
    baselinePhotosRow: {
        flexDirection: 'row',
        gap: 8,
    },
    baselinePhotoCard: {
        width: 100,
        height: 65,
        backgroundColor: '#0369a1',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    baselinePhotoIcon: {
        fontSize: 18,
        marginBottom: 2,
    },
    baselinePhotoText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#f8fafc',
        marginBottom: 12,
    },
    checklistGrid: {
        gap: 6,
        marginBottom: 12,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    checkItemChecked: {
        backgroundColor: '#f0fdf4',
        borderColor: '#86efac',
    },
    checkIcon: {
        fontSize: 16,
        marginRight: 8,
        color: '#059669',
    },
    checkLabel: {
        fontSize: 12,
        color: '#475569',
    },
    checkLabelChecked: {
        color: '#15803d',
        fontWeight: '600',
    },
    primaryBtn: {
        backgroundColor: '#0284c7',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    primaryBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    successBtn: {
        backgroundColor: '#059669',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 14,
    },
    successBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    lateFeeBox: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 14,
    },
    lateFeeHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    lateFeeText: {
        fontSize: 12,
        color: '#64748b',
    },
    overdueBadgeRow: {
        marginTop: 6,
        backgroundColor: '#fef2f2',
        padding: 8,
        borderRadius: 6,
    },
    overdueWarnText: {
        color: '#b91c1c',
        fontSize: 12,
        fontWeight: 'bold',
    },
    overdueAmount: {
        color: '#b91c1c',
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 2,
    },
    onTimeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    settlementBox: {
        backgroundColor: '#0f172a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    settlementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 3,
    },
    breakdownLabel: {
        color: '#cbd5e1',
        fontSize: 13,
    },
    breakdownVal: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 10,
    },
    netRefundRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    netRefundLabel: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    netRefundAmount: {
        color: '#4ade80',
        fontSize: 24,
        fontWeight: 'bold',
    },
    payoutMethodRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    payoutChip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
    },
    payoutChipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    payoutChipText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    payoutChipTextActive: {
        color: '#ffffff',
    },
    successIcon: {
        fontSize: 44,
        marginBottom: 8,
    },
    successHeading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669',
    },
    successSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        textAlign: 'center',
    },
    receiptBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 14,
        width: '100%',
        marginVertical: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    receiptItem: {
        fontSize: 13,
        color: '#334155',
        marginVertical: 3,
    },
    secondaryBtn: {
        marginTop: 10,
        paddingVertical: 6,
    },
    secondaryBtnText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    offlineSummaryBadge: {
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fdba74',
        borderRadius: 6,
        padding: 8,
        marginTop: 10,
    },
    offlineSummaryBadgeText: {
        fontSize: 11,
        color: '#c2410c',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
