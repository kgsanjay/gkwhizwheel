import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
} from 'react-native';

/**
 * Store Switcher Modal for staff assigned to multiple stores.
 * Scopes subsequent mobile operations (walk-in bookings, bike inventory, returns)
 * to the selected store per 01-REQUIREMENTS-AND-FEATURES.md Section 12.1.
 */
export default function StoreSwitcherModal({
    visible,
    stores = [],
    currentStore = null,
    onSelectStore,
    onClose = null,
    canDismiss = true,
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => {
                if (canDismiss && onClose) onClose();
            }}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Select Operating Store</Text>
                        <Text style={styles.subtitle}>
                            Choose the store you are operating from for this shift
                        </Text>
                    </View>
                    {canDismiss && onClose && (
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {stores.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Stores Assigned</Text>
                        <Text style={styles.emptySubtitle}>
                            Your account is not assigned to any active store locations. Please
                            contact your HQ manager.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={stores}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => {
                            const isSelected = currentStore && currentStore.id === item.id;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.storeCard,
                                        isSelected && styles.storeCardSelected,
                                    ]}
                                    onPress={() => onSelectStore(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text
                                            style={[
                                                styles.storeName,
                                                isSelected && styles.storeNameSelected,
                                            ]}
                                        >
                                            {item.name}
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.activeBadge}>
                                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.storeAddress} numberOfLines={2}>
                                        {item.address_line ? `${item.address_line}, ` : ''}
                                        {item.city}
                                        {item.pincode ? ` - ${item.pincode}` : ''}
                                    </Text>
                                    {item.phone && (
                                        <Text style={styles.storePhone}>📞 {item.phone}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#0f172a',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 3,
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#1e293b',
    },
    closeBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    storeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    storeCardSelected: {
        borderColor: '#0284c7',
        backgroundColor: '#f0f9ff',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    storeNameSelected: {
        color: '#0369a1',
    },
    activeBadge: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    storeAddress: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    storePhone: {
        fontSize: 12,
        color: '#475569',
        marginTop: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});
