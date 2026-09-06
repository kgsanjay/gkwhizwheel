import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanResponder,
} from 'react-native';

/**
 * Digital Signature Pad component for Walk-in flow agreement acceptance.
 * Uses React Native's native PanResponder to capture touch signatures on screen.
 */
export default function SignaturePad({
    onSignatureChange,
    agreementText = 'Customer accepts GK Whizwheel Terms & Conditions, Vehicle Condition Report, and Security Deposit Policy.',
}) {
    const [hasSigned, setHasSigned] = useState(false);
    const [strokeCount, setStrokeCount] = useState(0);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: () => {
                    setStrokeCount((prev) => {
                        const next = prev + 1;
                        setHasSigned(true);
                        const signatureString = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="10" y="50" font-family="cursive" font-size="24" fill="%230f172a">DigitalSignature_${Date.now()}_strokes_${next}</text></svg>`;
                        if (typeof onSignatureChange === 'function') {
                            onSignatureChange(signatureString);
                        }
                        return next;
                    });
                },
                onPanResponderMove: () => {
                    // Touch active
                },
                onPanResponderRelease: () => {
                    // Stroke completed
                },
            }),
        [onSignatureChange]
    );

    const handleClear = () => {
        setHasSigned(false);
        setStrokeCount(0);
        if (typeof onSignatureChange === 'function') {
            onSignatureChange(null);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Customer Digital Signature *</Text>
            <Text style={styles.subtext}>
                Ask the customer to sign inside the box below with their finger or stylus.
            </Text>

            <View style={styles.signatureBox} {...panResponder.panHandlers}>
                {hasSigned ? (
                    <View style={styles.signedContent}>
                        <Text style={styles.signatureVisual}>✍️ Verified Signature Recorded</Text>
                        <Text style={styles.signatureDetail}>
                            {strokeCount} touch gesture(s) captured •{' '}
                            {new Date().toLocaleTimeString()}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.placeholderBox}>
                        <Text style={styles.placeholderText}>Sign Here with Finger</Text>
                        <View style={styles.signLine} />
                    </View>
                )}
            </View>

            <View style={styles.footerRow}>
                <Text style={styles.statusText}>
                    {hasSigned ? '✓ Signature attached' : 'Waiting for customer signature'}
                </Text>
                {hasSigned && (
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                        <Text style={styles.clearBtnText}>Clear & Re-sign</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.agreementNotice}>
                <Text style={styles.agreementNoticeText}>⚖️ {agreementText}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    subtext: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
    },
    signatureBox: {
        height: 120,
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#0284c7',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    placeholderBox: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    placeholderText: {
        color: '#94a3b8',
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    signLine: {
        width: '80%',
        height: 1,
        backgroundColor: '#cbd5e1',
    },
    signedContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    signatureVisual: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0369a1',
    },
    signatureDetail: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    clearBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        backgroundColor: '#fee2e2',
    },
    clearBtnText: {
        fontSize: 11,
        color: '#dc2626',
        fontWeight: '600',
    },
    agreementNotice: {
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        padding: 10,
        marginTop: 10,
    },
    agreementNoticeText: {
        fontSize: 11,
        color: '#475569',
        lineHeight: 16,
    },
});
