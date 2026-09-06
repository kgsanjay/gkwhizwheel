import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    ScrollView,
} from 'react-native';

/**
 * In-App Update Prompt Modal.
 * Alerts staff when a newer sideloaded APK is available on the internal server,
 * providing direct download and release notes.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {object} props.updateInfo - Contains latestVersion, currentVersion, apkUrl, releaseNotes, isMandatory
 * @param {Function} props.onDismiss
 */
export default function UpdatePromptModal({ visible, updateInfo, onDismiss }) {
    if (!visible || !updateInfo) return null;

    const handleDownload = () => {
        if (updateInfo.apkUrl) {
            Linking.openURL(updateInfo.apkUrl).catch((err) => {
                console.error('Failed to open APK download link:', err);
            });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={updateInfo.isMandatory ? undefined : onDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.dialogContainer}>
                    {/* Header Icon & Title */}
                    <View style={styles.header}>
                        <Text style={styles.icon}>🚀</Text>
                        <Text style={styles.title}>Update Available</Text>
                        <Text style={styles.subtitle}>
                            A newer version of the GK Whizwheel Staff App is ready to install.
                        </Text>
                    </View>

                    {/* Version Comparison Badges */}
                    <View style={styles.versionBadgeRow}>
                        <View style={styles.versionChip}>
                            <Text style={styles.versionChipLabel}>CURRENT</Text>
                            <Text style={styles.versionChipValue}>
                                v{updateInfo.currentVersion || '1.0.0'}
                            </Text>
                        </View>
                        <Text style={styles.arrowText}>➔</Text>
                        <View style={[styles.versionChip, styles.versionChipNew]}>
                            <Text style={[styles.versionChipLabel, { color: '#047857' }]}>
                                NEW RELEASE
                            </Text>
                            <Text style={[styles.versionChipValue, { color: '#065f46' }]}>
                                v{updateInfo.latestVersion}
                            </Text>
                        </View>
                    </View>

                    {/* Release Notes */}
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesHeading}>What's New in this Build:</Text>
                        <ScrollView style={styles.notesScroll} nestedScrollEnabled>
                            <Text style={styles.notesText}>
                                {updateInfo.releaseNotes || 'General performance and stability improvements.'}
                            </Text>
                        </ScrollView>
                    </View>

                    <Text style={styles.helpText}>
                        * Tapping download will download the APK file directly to your device. Open the downloaded file to install.
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                            <Text style={styles.downloadBtnText}>📥 Download APK Update</Text>
                        </TouchableOpacity>

                        {!updateInfo.isMandatory && (
                            <TouchableOpacity style={styles.laterBtn} onPress={onDismiss}>
                                <Text style={styles.laterBtnText}>Remind Me Later</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dialogContainer: {
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: 420,
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 36,
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
    },
    versionBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    versionChip: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    versionChipNew: {
        backgroundColor: '#d1fae5',
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    versionChipLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    versionChipValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 2,
    },
    arrowText: {
        fontSize: 16,
        color: '#94a3b8',
    },
    notesContainer: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    notesHeading: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 6,
    },
    notesScroll: {
        maxHeight: 100,
    },
    notesText: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
    helpText: {
        fontSize: 11,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginBottom: 16,
        textAlign: 'center',
    },
    buttonRow: {
        gap: 8,
    },
    downloadBtn: {
        backgroundColor: '#0284c7',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    downloadBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    laterBtn: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    laterBtnText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: '500',
    },
});
