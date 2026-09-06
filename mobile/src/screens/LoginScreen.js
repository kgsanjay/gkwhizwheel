import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';

export default function LoginScreen() {
    const { login, requestOtp, loginWithOtp, isLoading, error } = useAuth();

    const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
    const [identifier, setIdentifier] = useState('manager@gkwhizwheel.com');
    const [password, setPassword] = useState('password');

    const [otpEmail, setOtpEmail] = useState('staff@gkwhizwheel.com');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [requestingOtp, setRequestingOtp] = useState(false);

    const handlePasswordSubmit = async () => {
        if (!identifier.trim() || !password) {
            Alert.alert('Validation Error', 'Please enter your email/phone and password.');
            return;
        }

        try {
            await login(identifier.trim(), password);
        } catch (err) {
            Alert.alert('Login Failed', err.message || 'Invalid credentials');
        }
    };

    const handleRequestOtp = async () => {
        if (!otpEmail.trim()) {
            Alert.alert('Validation Error', 'Please enter your staff email.');
            return;
        }

        setRequestingOtp(true);
        try {
            await requestOtp(otpEmail.trim());
            setOtpSent(true);
            Alert.alert('OTP Sent', `A 6-digit login OTP has been sent to ${otpEmail.trim()}`);
        } catch (err) {
            Alert.alert('OTP Request Failed', err.message || 'Could not send OTP');
        } finally {
            setRequestingOtp(false);
        }
    };

    const handleOtpVerify = async () => {
        if (!otpEmail.trim() || !otpCode.trim()) {
            Alert.alert('Validation Error', 'Please enter both your email and the 6-digit OTP.');
            return;
        }

        try {
            await loginWithOtp(otpEmail.trim(), otpCode.trim());
        } catch (err) {
            Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP');
        }
    };

    // Quick demo login helpers
    const fillPreset = (email, pwd) => {
        setAuthMode('password');
        setIdentifier(email);
        setPassword(pwd);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Branding */}
                <View style={styles.brandContainer}>
                    <View style={styles.logoBadge}>
                        <Text style={styles.logoIcon}>⚡</Text>
                    </View>
                    <Text style={styles.brandTitle}>GK Whizwheel</Text>
                    <Text style={styles.brandSubtitle}>Store Operations & POS (Android)</Text>
                    <View style={styles.staffTag}>
                        <Text style={styles.staffTagText}>STAFF & MANAGER PORTAL</Text>
                    </View>
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, authMode === 'password' && styles.tabActive]}
                        onPress={() => setAuthMode('password')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                authMode === 'password' && styles.tabTextActive,
                            ]}
                        >
                            Password Login
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, authMode === 'otp' && styles.tabActive]}
                        onPress={() => setAuthMode('otp')}
                    >
                        <Text
                            style={[styles.tabText, authMode === 'otp' && styles.tabTextActive]}
                        >
                            Email OTP
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Form Body */}
                <View style={styles.formCard}>
                    {error && (
                        <View style={styles.errorAlert}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {authMode === 'password' ? (
                        <>
                            <Text style={styles.label}>Email or Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. staff@gkwhizwheel.com or 9876543210"
                                placeholderTextColor="#94a3b8"
                                value={identifier}
                                onChangeText={setIdentifier}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                                onPress={handlePasswordSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Sign In to Store</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Staff Email Address</Text>
                            <View style={styles.otpRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder="e.g. staff@gkwhizwheel.com"
                                    placeholderTextColor="#94a3b8"
                                    value={otpEmail}
                                    onChangeText={setOtpEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.reqOtpBtn,
                                        requestingOtp && styles.submitBtnDisabled,
                                    ]}
                                    onPress={handleRequestOtp}
                                    disabled={requestingOtp}
                                >
                                    {requestingOtp ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <Text style={styles.reqOtpBtnText}>
                                            {otpSent ? 'Resend' : 'Send'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.label, { marginTop: 16 }]}>6-Digit OTP Code</Text>
                            <TextInput
                                style={[styles.input, styles.otpInput]}
                                placeholder="000000"
                                placeholderTextColor="#94a3b8"
                                value={otpCode}
                                onChangeText={setOtpCode}
                                keyboardType="number-pad"
                                maxLength={6}
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                                onPress={handleOtpVerify}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Verify & Sign In</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Quick Presets */}
                <View style={styles.presetSection}>
                    <Text style={styles.presetHeading}>Quick Staff Credentials</Text>
                    <View style={styles.presetButtons}>
                        <TouchableOpacity
                            style={styles.presetBtn}
                            onPress={() => fillPreset('manager@gkwhizwheel.com', 'password')}
                        >
                            <Text style={styles.presetBtnText}>Store Manager (Indiranagar)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetBtn}
                            onPress={() => fillPreset('staff@gkwhizwheel.com', 'password')}
                        >
                            <Text style={styles.presetBtnText}>
                                Multi-Store Staff (Indiranagar & Koramangala)
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetBtn}
                            onPress={() => fillPreset('admin@gkwhizwheel.com', 'password')}
                        >
                            <Text style={styles.presetBtnText}>Super Admin (All Stores)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 36,
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoBadge: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#0284c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoIcon: {
        fontSize: 26,
        color: '#ffffff',
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    brandSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },
    staffTag: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },
    staffTagText: {
        color: '#38bdf8',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    tabActive: {
        backgroundColor: '#0284c7',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    tabTextActive: {
        color: '#ffffff',
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    errorAlert: {
        backgroundColor: '#fef2f2',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
        padding: 10,
        borderRadius: 4,
        marginBottom: 16,
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 13,
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
    otpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 0,
    },
    reqOtpBtn: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reqOtpBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    otpInput: {
        fontSize: 20,
        letterSpacing: 6,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    submitBtn: {
        backgroundColor: '#0284c7',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    presetSection: {
        marginTop: 8,
    },
    presetHeading: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        textAlign: 'center',
    },
    presetButtons: {
        gap: 8,
    },
    presetBtn: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    presetBtnText: {
        color: '#cbd5e1',
        fontSize: 12,
    },
});
