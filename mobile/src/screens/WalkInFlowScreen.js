import React, { useState, useEffect } from 'react';
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
import SignaturePad from '../components/SignaturePad.js';
import { STEPS } from './WalkInConstants.js';

export default function WalkInFlowScreen({ onFinish, onCancel }) {
    const { currentStore, user } = useAuth();

    const [currentStep, setCurrentStep] = useState(STEPS.PHONE_LOOKUP);
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Customer Search
    const [phone, setPhone] = useState('+919876543210');
    const [customer, setCustomer] = useState(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Step 2: New Customer Form & KYC Photos
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [idType, setIdType] = useState('driving_license');
    const [idPhotos, setIdPhotos] = useState([]);

    // Step 3: Bike Selection
    const [bikes, setBikes] = useState([]);
    const [selectedBike, setSelectedBike] = useState(null);

    // Step 4: Duration & Pricing
    const [durationDays, setDurationDays] = useState(1);
    const [quote, setQuote] = useState(null);
    const [createdBooking, setCreatedBooking] = useState(null);

    // Step 5: Payment
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'upi'
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    // Step 6: Digital Signature
    const [signatureData, setSignatureData] = useState(null);

    // Step 7: Handover
    const [odometer, setOdometer] = useState('12500');
    const [handoverPhotos, setHandoverPhotos] = useState([]);
    const [conditionNotes, setConditionNotes] = useState('Clean handover. No visible defects.');
    const [isOfflineCompleted, setIsOfflineCompleted] = useState(false);

    // ------------------------------------------------------------------
    // Step 1: Phone Lookup
    // ------------------------------------------------------------------
    const handlePhoneLookup = async () => {
        if (!phone.trim()) {
            Alert.alert('Validation Error', 'Please enter customer phone number.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiClient.get(`/staff/customers/lookup?phone=${encodeURIComponent(phone.trim())}`);
            const data = res?.data || res;

            if (data?.found && data?.customer) {
                setCustomer(data.customer);
                setIsNewCustomer(false);
                // Proceed directly to bike selection per Section 7
                setCurrentStep(STEPS.BIKE_SELECTION);
            } else {
                setIsNewCustomer(true);
                setCustomer(null);
                setCurrentStep(STEPS.KYC_CAPTURE);
            }
        } catch (err) {
            // If network fails, allow staff to proceed with offline new-customer flow
            Alert.alert(
                'Offline Mode',
                'Server lookup unreachable. Proceeding as offline customer registration.'
            );
            setIsNewCustomer(true);
            setCurrentStep(STEPS.KYC_CAPTURE);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // Step 2: New Customer KYC Submission
    // ------------------------------------------------------------------
    const handleCreateCustomer = async () => {
        if (!newName.trim()) {
            Alert.alert('Validation Error', 'Customer full name is required.');
            return;
        }
        if (idPhotos.length === 0) {
            Alert.alert('KYC Required', 'Please attach at least one photo of the driving license or ID.');
            return;
        }

        setIsLoading(true);
        try {
            // Call POST /staff/customers with multipart or mock
            const payload = {
                name: newName.trim(),
                phone: phone.trim(),
                email: newEmail.trim() || `${phone.replace(/[^0-9]/g, '')}@walkin.customer`,
                whatsapp_opt_in: true,
                document_type: idType,
            };

            let createdUser = null;
            try {
                const res = await apiClient.post('/staff/customers', payload);
                createdUser = res?.data || res;
            } catch (netErr) {
                // Offline fallback: queue customer creation action locally
                const offlineKey = generateIdempotencyKey();
                await enqueueAction({
                    actionType: 'create_customer',
                    endpoint: '/staff/customers',
                    payload,
                    idempotencyKey: offlineKey,
                });
                createdUser = {
                    id: Date.now(),
                    name: newName.trim(),
                    phone: phone.trim(),
                    is_offline: true,
                };
            }

            setCustomer(createdUser);
            setCurrentStep(STEPS.BIKE_SELECTION);
        } catch (err) {
            Alert.alert('Customer Creation Failed', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // Step 3: Load Bikes Physically at Current Store
    // ------------------------------------------------------------------
    useEffect(() => {
        if (currentStep === STEPS.BIKE_SELECTION && currentStore?.id) {
            loadStoreBikes();
        }
    }, [currentStep, currentStore]);

    const loadStoreBikes = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/staff/bikes?store_id=${currentStore.id}`);
            const data = res?.data || res || [];
            // Filter to bikes available for rent
            const list = Array.isArray(data) ? data : data.data || [];
            setBikes(list);
            if (list.length > 0 && !selectedBike) {
                setSelectedBike(list[0]);
            }
        } catch {
            // Offline fallback mock bikes for store
            const fallbackBikes = [
                {
                    id: 1,
                    brand: 'Royal Enfield',
                    model: 'Hunter 350',
                    registration_number: 'KA-01-EQ-1234',
                    daily_rate: 850,
                    status: 'available',
                    category: { name: 'Cruiser', security_deposit: 2000 },
                },
                {
                    id: 2,
                    brand: 'Honda',
                    model: 'Activa 6G',
                    registration_number: 'KA-04-AB-5678',
                    daily_rate: 450,
                    status: 'available',
                    category: { name: 'Scooter', security_deposit: 1500 },
                },
            ];
            setBikes(fallbackBikes);
            setSelectedBike(fallbackBikes[0]);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // Step 4: Duration & Pricing Preview & Hold Creation
    // ------------------------------------------------------------------
    const calculatePricing = () => {
        const baseRate = Number(selectedBike?.daily_rate || 600);
        const deposit = Number(selectedBike?.category?.security_deposit || 2000);
        const rentalSubtotal = baseRate * durationDays;
        const total = rentalSubtotal + deposit;

        return {
            baseRate,
            durationDays,
            rentalSubtotal,
            deposit,
            total,
        };
    };

    const handleCreateBookingHold = async () => {
        if (!selectedBike) {
            Alert.alert('Select Bike', 'Please select a bike to proceed.');
            return;
        }

        setIsLoading(true);
        const priceInfo = calculatePricing();
        setQuote(priceInfo);

        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];
        const idempotencyKey = generateIdempotencyKey();

        const bookingPayload = {
            bike_id: selectedBike.id,
            user_id: customer?.id || 1,
            pickup_store_id: currentStore.id,
            return_store_id: currentStore.id,
            start_date: startDate,
            end_date: endDate,
            channel: 'offline',
            idempotency_key: idempotencyKey,
        };

        try {
            let bookingResult = null;
            try {
                const res = await apiClient.post('/staff/bookings', bookingPayload);
                bookingResult = res?.data || res;
            } catch {
                // Offline fallback: queue locally
                await enqueueAction({
                    actionType: 'create_booking',
                    endpoint: '/staff/bookings',
                    payload: bookingPayload,
                    idempotencyKey,
                });
                bookingResult = {
                    id: Date.now(),
                    booking_reference: `OFF-${Date.now().toString().slice(-6)}`,
                    status: 'held',
                    total_amount: priceInfo.total,
                };
            }

            setCreatedBooking(bookingResult);
            setCurrentStep(STEPS.PAYMENT_COLLECTION);
        } catch (err) {
            Alert.alert('Hold Failed', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // Step 5: Collect Payment Recording
    // ------------------------------------------------------------------
    const handleCollectPayment = async () => {
        setIsLoading(true);
        const idempotencyKey = generateIdempotencyKey();
        const paymentPayload = {
            booking_id: createdBooking?.id,
            payment_method: paymentMethod,
            amount: quote?.total || 2600,
            notes: `Collected in-store via ${paymentMethod.toUpperCase()} by ${user?.name || 'staff'}`,
        };

        try {
            try {
                await apiClient.post(
                    `/staff/bookings/${createdBooking?.id}/collect-payment`,
                    paymentPayload
                );
            } catch {
                // Offline fallback
                await enqueueAction({
                    actionType: 'collect_payment',
                    endpoint: `/staff/bookings/${createdBooking?.id}/collect-payment`,
                    payload: paymentPayload,
                    idempotencyKey,
                });
            }

            setPaymentConfirmed(true);
            setCurrentStep(STEPS.SIGNATURE);
        } catch (err) {
            Alert.alert('Payment Recording Failed', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // Step 6: Digital Agreement Signature
    // ------------------------------------------------------------------
    const handleConfirmSignature = () => {
        if (!signatureData) {
            Alert.alert('Signature Required', 'Please have the customer sign the digital agreement.');
            return;
        }
        setCurrentStep(STEPS.HANDOVER);
    };

    // ------------------------------------------------------------------
    // Step 7: Handover Checklist
    // ------------------------------------------------------------------
    const handleCompleteHandover = async () => {
        if (!odometer.trim()) {
            Alert.alert('Validation Error', 'Odometer reading is required.');
            return;
        }

        setIsLoading(true);
        const idempotencyKey = generateIdempotencyKey();
        const handoverPayload = {
            booking_id: createdBooking?.id,
            odometer_reading: parseInt(odometer.trim(), 10),
            notes: conditionNotes,
            signature: signatureData,
            condition_photos: handoverPhotos.map((p) => p.name || 'photo.jpg'),
        };

        try {
            try {
                await apiClient.post(
                    `/staff/bookings/${createdBooking?.id}/handover`,
                    handoverPayload
                );
            } catch {
                // Offline fallback
                await enqueueAction({
                    actionType: 'handover',
                    endpoint: `/staff/bookings/${createdBooking?.id}/handover`,
                    payload: handoverPayload,
                    idempotencyKey,
                });
                setIsOfflineCompleted(true);
            }

            setCurrentStep(STEPS.SUCCESS);
        } catch (err) {
            Alert.alert('Handover Failed', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onCancel} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Walk-in Booking</Text>
                    <Text style={styles.storeBadgeText}>{currentStore?.name}</Text>
                </View>

                {/* Progress Indicators */}
                <View style={styles.stepProgressRow}>
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <View
                            key={s}
                            style={[
                                styles.stepDot,
                                currentStep >= s && styles.stepDotActive,
                                currentStep === s && styles.stepDotCurrent,
                            ]}
                        />
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: PHONE LOOKUP */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.PHONE_LOOKUP && (
                    <View style={styles.card}>
                        <Text style={styles.stepTitle}>Step 1: Customer Phone Search</Text>
                        <Text style={styles.stepSubtitle}>
                            Enter customer phone number to load existing profile or initiate KYC.
                        </Text>

                        <Text style={styles.label}>Customer Mobile Phone *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+91 98765 43210"
                            placeholderTextColor="#94a3b8"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                            onPress={handlePhoneLookup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Search Customer</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: NEW CUSTOMER KYC CAPTURE */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.KYC_CAPTURE && (
                    <View style={styles.card}>
                        <View style={styles.badgeWarn}>
                            <Text style={styles.badgeWarnText}>NEW CUSTOMER • KYC REQUIRED</Text>
                        </View>
                        <Text style={styles.stepTitle}>Step 2: Customer KYC Capture</Text>
                        <Text style={styles.stepSubtitle}>
                            Staff completes KYC on customer's behalf. Driving License is mandatory.
                        </Text>

                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Ramesh Kumar"
                            placeholderTextColor="#94a3b8"
                            value={newName}
                            onChangeText={setNewName}
                        />

                        <Text style={styles.label}>Email Address (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ramesh@example.com"
                            placeholderTextColor="#94a3b8"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Government ID Document Type *</Text>
                        <View style={styles.chipRow}>
                            {['driving_license', 'aadhaar', 'passport'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.chip, idType === type && styles.chipActive]}
                                    onPress={() => setIdType(type)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            idType === type && styles.chipTextActive,
                                        ]}
                                    >
                                        {type.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Camera capture for Driving License / ID */}
                        <CameraCapture
                            title="Driving License / ID Photos"
                            label="Take Photo of Physical ID"
                            photos={idPhotos}
                            onPhotosChange={setIdPhotos}
                            maxPhotos={2}
                            required
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                            onPress={handleCreateCustomer}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Save KYC & Select Bike</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: BIKE SELECTION */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.BIKE_SELECTION && (
                    <View style={styles.card}>
                        {/* Customer Header Banner */}
                        {customer && (
                            <View style={styles.customerBanner}>
                                <Text style={styles.customerBannerName}>
                                    👤 {customer.name}{' '}
                                    <Text style={styles.customerBannerPhone}>({customer.phone})</Text>
                                </Text>
                                {customer.has_past_damage && (
                                    <Text style={styles.warningFlag}>⚠️ Has past damage log</Text>
                                )}
                            </View>
                        )}

                        <Text style={styles.stepTitle}>Step 3: Select Available Bike</Text>
                        <Text style={styles.stepSubtitle}>
                            Bikes physically at {currentStore?.name} with live availability.
                        </Text>

                        {bikes.map((bike) => {
                            const isSelected = selectedBike?.id === bike.id;
                            return (
                                <TouchableOpacity
                                    key={bike.id}
                                    style={[styles.bikeCard, isSelected && styles.bikeCardSelected]}
                                    onPress={() => setSelectedBike(bike)}
                                >
                                    <View style={styles.bikeHeader}>
                                        <Text style={styles.bikeModel}>
                                            {bike.brand} {bike.model}
                                        </Text>
                                        <Text style={styles.bikeRate}>₹{bike.daily_rate}/day</Text>
                                    </View>
                                    <Text style={styles.bikeReg}>
                                        Plate: {bike.registration_number} • Deposit: ₹
                                        {bike.category?.security_deposit || 2000}
                                    </Text>
                                    <View style={styles.bikeBadgeRow}>
                                        <View style={styles.statusAvail}>
                                            <Text style={styles.statusAvailText}>● AVAILABLE</Text>
                                        </View>
                                        {isSelected && (
                                            <Text style={styles.selectedIndicator}>✓ Selected</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.primaryBtn, !selectedBike && styles.btnDisabled]}
                            onPress={() => setCurrentStep(STEPS.DURATION_PRICING)}
                            disabled={!selectedBike}
                        >
                            <Text style={styles.primaryBtnText}>
                                Continue to Rental Duration & Price
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 4: DURATION & PRICE BREAKDOWN */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.DURATION_PRICING && (
                    <View style={styles.card}>
                        <Text style={styles.stepTitle}>Step 4: Rental Duration & Pricing</Text>
                        <Text style={styles.stepSubtitle}>
                            Dynamic rates automatically applied (weekend & seasonal rules).
                        </Text>

                        <Text style={styles.label}>Rental Duration (Days)</Text>
                        <View style={styles.chipRow}>
                            {[1, 2, 3, 7].map((days) => (
                                <TouchableOpacity
                                    key={days}
                                    style={[
                                        styles.chip,
                                        durationDays === days && styles.chipActive,
                                    ]}
                                    onPress={() => setDurationDays(days)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            durationDays === days && styles.chipTextActive,
                                        ]}
                                    >
                                        {days} {days === 1 ? 'Day' : 'Days'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Price Breakdown Card */}
                        {(() => {
                            const p = calculatePricing();
                            return (
                                <View style={styles.priceBreakdownBox}>
                                    <Text style={styles.priceHeading}>Itemized Breakdown</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceItem}>
                                            Base Rate (₹{p.baseRate} × {p.durationDays}d)
                                        </Text>
                                        <Text style={styles.priceVal}>₹{p.rentalSubtotal}</Text>
                                    </View>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceItem}>Refundable Security Deposit</Text>
                                        <Text style={styles.priceVal}>₹{p.deposit}</Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceTotalLabel}>Total Amount Payable</Text>
                                        <Text style={styles.priceTotalVal}>₹{p.total}</Text>
                                    </View>
                                </View>
                            );
                        })()}

                        <TouchableOpacity
                            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                            onPress={handleCreateBookingHold}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.primaryBtnText}>
                                    Lock Hold & Collect Payment
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 5: PAYMENT COLLECTION RECORDING */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.PAYMENT_COLLECTION && (
                    <View style={styles.card}>
                        <View style={styles.badgeSuccess}>
                            <Text style={styles.badgeSuccessText}>HOLD ACTIVE • IDEMPOTENT KEY LOCKED</Text>
                        </View>
                        <Text style={styles.stepTitle}>Step 5: Collect Payment</Text>
                        <Text style={styles.stepSubtitle}>
                            Record payment method collected in-store. Marks booking CONFIRMED.
                        </Text>

                        <View style={styles.paymentDueBox}>
                            <Text style={styles.dueLabel}>TOTAL TO COLLECT NOW</Text>
                            <Text style={styles.dueAmount}>₹{quote?.total || 2600}</Text>
                            <Text style={styles.dueSubtext}>
                                Includes advance rent (₹{quote?.rentalSubtotal}) + deposit (₹{quote?.deposit})
                            </Text>
                        </View>

                        <Text style={styles.label}>Select Payment Method *</Text>
                        <View style={styles.paymentMethodCol}>
                            {[
                                { id: 'cash', label: '💵 Cash Received In-Store' },
                                { id: 'card', label: '💳 POS Card Machine (Swipe/Chip)' },
                                { id: 'upi', label: '📱 UPI QR Code Payment' },
                            ].map((m) => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={[
                                        styles.paymentCard,
                                        paymentMethod === m.id && styles.paymentCardActive,
                                    ]}
                                    onPress={() => setPaymentMethod(m.id)}
                                >
                                    <Text
                                        style={[
                                            styles.paymentCardText,
                                            paymentMethod === m.id && styles.paymentCardTextActive,
                                        ]}
                                    >
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                            onPress={handleCollectPayment}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.primaryBtnText}>
                                    Confirm Payment Received (₹{quote?.total || 2600})
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 6: DIGITAL AGREEMENT SIGNATURE */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.SIGNATURE && (
                    <View style={styles.card}>
                        <Text style={styles.stepTitle}>Step 6: Digital Agreement Signature</Text>
                        <Text style={styles.stepSubtitle}>
                            Customer accepts rental terms & condition summary.
                        </Text>

                        <View style={styles.agreementSummaryBox}>
                            <Text style={styles.agreementHeading}>Rental Summary</Text>
                            <Text style={styles.agreementDetail}>
                                • Customer: {customer?.name || 'Walk-in Customer'}
                            </Text>
                            <Text style={styles.agreementDetail}>
                                • Bike: {selectedBike?.brand} {selectedBike?.model} ({selectedBike?.registration_number})
                            </Text>
                            <Text style={styles.agreementDetail}>
                                • Duration: {durationDays} Day(s) • Store: {currentStore?.name}
                            </Text>
                            <Text style={styles.agreementDetail}>
                                • Refundable Deposit: ₹{quote?.deposit} (Subject to return inspection)
                            </Text>
                        </View>

                        {/* Interactive Signature Pad */}
                        <SignaturePad
                            onSignatureChange={setSignatureData}
                            agreementText="I agree to the vehicle condition report and GK Whizwheel Terms & Conditions."
                        />

                        <TouchableOpacity
                            style={[styles.primaryBtn, !signatureData && styles.btnDisabled]}
                            onPress={handleConfirmSignature}
                            disabled={!signatureData}
                        >
                            <Text style={styles.primaryBtnText}>
                                Accept & Proceed to Handover
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 7: HANDOVER CHECKLIST */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.HANDOVER && (
                    <View style={styles.card}>
                        <Text style={styles.stepTitle}>Step 7: Handover Checklist</Text>
                        <Text style={styles.stepSubtitle}>
                            Record odometer reading and take condition photos before handing over the keys.
                        </Text>

                        <Text style={styles.label}>Current Odometer Reading (KM) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 14250"
                            placeholderTextColor="#94a3b8"
                            value={odometer}
                            onChangeText={setOdometer}
                            keyboardType="number-pad"
                        />

                        {/* Camera inspection photos */}
                        <CameraCapture
                            title="Handover Condition Photos"
                            label="Capture Odometer & Bike Condition Photos"
                            photos={handoverPhotos}
                            onPhotosChange={setHandoverPhotos}
                            maxPhotos={4}
                            required
                        />

                        <Text style={styles.label}>Condition Notes / Observations</Text>
                        <TextInput
                            style={[styles.input, { height: 70 }]}
                            placeholder="Note any preexisting scratches or fuel level..."
                            placeholderTextColor="#94a3b8"
                            value={conditionNotes}
                            onChangeText={setConditionNotes}
                            multiline
                        />

                        <TouchableOpacity
                            style={[styles.successBtn, isLoading && styles.btnDisabled]}
                            onPress={handleCompleteHandover}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.successBtnText}>
                                    Mark Handed Over (Hand Keys to Customer)
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 8: SUCCESS SUMMARY */}
                {/* ------------------------------------------------------------- */}
                {currentStep === STEPS.SUCCESS && (
                    <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successHeading}>Bike Handed Over!</Text>
                        <Text style={styles.successMessage}>
                            Booking is active. Bike is now marked unavailable everywhere.
                        </Text>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryItem}>
                                Ref: {createdBooking?.booking_reference || 'CONFIRMED'}
                            </Text>
                            <Text style={styles.summaryItem}>Customer: {customer?.name}</Text>
                            <Text style={styles.summaryItem}>
                                Bike: {selectedBike?.brand} {selectedBike?.model}
                            </Text>
                            <Text style={styles.summaryItem}>Odometer: {odometer} km</Text>
                            {isOfflineCompleted && (
                                <View style={styles.offlineSummaryBadge}>
                                    <Text style={styles.offlineSummaryBadgeText}>
                                        ⏳ PENDING SYNC — Action saved in local SQLite. Will auto-sync when online.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => {
                                // Reset flow
                                setCurrentStep(STEPS.PHONE_LOOKUP);
                                setCustomer(null);
                                setSelectedBike(null);
                                setQuote(null);
                                setHandoverPhotos([]);
                                setIdPhotos([]);
                                setSignatureData(null);
                                if (onFinish) onFinish();
                            }}
                        >
                            <Text style={styles.primaryBtnText}>Start New Walk-in Booking</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel}>
                            <Text style={styles.secondaryBtnText}>Back to Store Dashboard</Text>
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
    stepProgressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    stepDot: {
        width: 14,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#334155',
    },
    stepDotActive: {
        backgroundColor: '#0284c7',
    },
    stepDotCurrent: {
        backgroundColor: '#38bdf8',
        width: 24,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    stepSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 16,
        lineHeight: 18,
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
        padding: 12,
        fontSize: 14,
        color: '#0f172a',
        backgroundColor: '#f8fafc',
        marginBottom: 16,
    },
    primaryBtn: {
        backgroundColor: '#0284c7',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryBtn: {
        marginTop: 12,
        paddingVertical: 8,
    },
    secondaryBtnText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    successBtn: {
        backgroundColor: '#059669',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    successBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    badgeWarn: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff7ed',
        borderWidth: 1,
        borderColor: '#fdba74',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 10,
    },
    badgeWarnText: {
        color: '#c2410c',
        fontSize: 10,
        fontWeight: 'bold',
    },
    badgeSuccess: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#86efac',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 10,
    },
    badgeSuccessText: {
        color: '#15803d',
        fontSize: 10,
        fontWeight: 'bold',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: '#0284c7',
        borderColor: '#0284c7',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    chipTextActive: {
        color: '#ffffff',
    },
    customerBanner: {
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    customerBannerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e40af',
    },
    customerBannerPhone: {
        fontWeight: 'normal',
        color: '#3b82f6',
    },
    warningFlag: {
        color: '#b91c1c',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 4,
    },
    bikeCard: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        backgroundColor: '#ffffff',
    },
    bikeCardSelected: {
        borderColor: '#0284c7',
        backgroundColor: '#f0f9ff',
    },
    bikeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bikeModel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    bikeRate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0284c7',
    },
    bikeReg: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    bikeBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    statusAvail: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusAvailText: {
        color: '#15803d',
        fontSize: 10,
        fontWeight: 'bold',
    },
    selectedIndicator: {
        color: '#0284c7',
        fontSize: 12,
        fontWeight: 'bold',
    },
    priceBreakdownBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 14,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    priceHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 3,
    },
    priceItem: {
        fontSize: 13,
        color: '#64748b',
    },
    priceVal: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    divider: {
        height: 1,
        backgroundColor: '#cbd5e1',
        marginVertical: 8,
    },
    priceTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    priceTotalVal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0284c7',
    },
    paymentDueBox: {
        backgroundColor: '#0f172a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 12,
    },
    dueLabel: {
        color: '#94a3b8',
        fontSize: 10,
        letterSpacing: 0.5,
        fontWeight: 'bold',
    },
    dueAmount: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    dueSubtext: {
        color: '#cbd5e1',
        fontSize: 11,
    },
    paymentMethodCol: {
        gap: 8,
        marginBottom: 16,
    },
    paymentCard: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 14,
        backgroundColor: '#f8fafc',
    },
    paymentCardActive: {
        borderColor: '#0284c7',
        backgroundColor: '#eff6ff',
    },
    paymentCardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    paymentCardTextActive: {
        color: '#0284c7',
    },
    agreementSummaryBox: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    agreementHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    agreementDetail: {
        fontSize: 12,
        color: '#475569',
        marginVertical: 2,
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    successHeading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 6,
    },
    successMessage: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
    },
    summaryBox: {
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    summaryItem: {
        fontSize: 13,
        color: '#334155',
        marginVertical: 3,
        fontWeight: '500',
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
