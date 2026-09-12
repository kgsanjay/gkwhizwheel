import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { api } from '../api/client';
import { ServiceItem } from '../api/types';
import { DEDICATED_SERVICES, SERVICES_LIST, ServiceDefinition } from '../api/servicesData';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { ServiceSkeleton } from '../components/ServiceSkeleton';

export const ServicesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveServiceItems, setLiveServiceItems] = useState<ServiceItem[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>(SERVICES_LIST);

  const fetchServices = async () => {
    try {
      const res = await api.publicApi.getServices();
      if (res.success && Array.isArray(res.data)) {
        setLiveServiceItems(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch live backend service items, using cached catalog', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch with short delay to demonstrate smooth skeleton loading
    const timer = setTimeout(() => {
      fetchServices();
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleServicePress = (service: ServiceDefinition) => {
    navigation.navigate('ServiceDetail', {
      serviceId: service.id,
      serviceSlug: service.slug,
    });
  };

  // Helper to count available backend items for a specific service type
  const getItemCountForService = (serviceType: string) => {
    if (!liveServiceItems.length) return null;
    const count = liveServiceItems.filter((i) => i.service_type === serviceType).length;
    return count > 0 ? `${count} options available` : null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header & Toggle Section */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerBadge}>HONNAVAR & COASTAL EXPERIENCES</Text>
            <Text style={styles.headerTitle}>All 7 Services</Text>
            <Text style={styles.headerSubtitle}>
              From self-drive bikes to backwater boat cruises & scuba diving
            </Text>
          </View>

          {/* List / Grid Toggle Buttons */}
          <View style={styles.toggleRow}>
            <View style={styles.togglePillContainer} accessible={true} accessibilityRole="tablist">
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'list' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('list')}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="List view mode"
                accessibilityState={{ selected: viewMode === 'list' }}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    viewMode === 'list' && styles.toggleButtonTextActive,
                  ]}
                >
                  ☰ List
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'grid' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('grid')}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="Grid view mode"
                accessibilityState={{ selected: viewMode === 'grid' }}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    viewMode === 'grid' && styles.toggleButtonTextActive,
                  ]}
                >
                  ⊞ Grid
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content Area: Skeleton while loading, else List or Grid */}
        {loading ? (
          <ScrollView contentContainerStyle={styles.loadingScroll}>
            <ServiceSkeleton viewMode={viewMode} count={7} />
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {viewMode === 'list' ? (
              // 1. LIST VIEW
              <View style={styles.listContainer}>
                {services.map((service) => {
                  const liveCount = getItemCountForService(service.serviceType);
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.listCard}
                      onPress={() => handleServicePress(service)}
                      activeOpacity={0.85}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${service.shortTitle}, ${service.category}, ${service.startingPrice}, Rating ${service.rating} stars`}
                      accessibilityHint="Double tap to open dedicated service details and booking"
                    >
                      <View
                        style={[
                          styles.listIconBox,
                          { backgroundColor: `${service.color}18` },
                        ]}
                        importantForAccessibility="no-hide-descendants"
                        accessibilityElementsHidden={true}
                      >
                        <Text style={styles.listIconText}>{service.icon}</Text>
                      </View>

                      <View style={styles.listContent} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
                        <View style={styles.listCategoryRow}>
                          <Text
                            style={[
                              styles.listCategoryText,
                              { color: service.color },
                            ]}
                          >
                            {service.category.toUpperCase()}
                          </Text>
                          <Text style={styles.listRatingText}>
                            ★ {service.rating} ({service.reviewCount})
                          </Text>
                        </View>

                        <Text style={styles.listTitle} numberOfLines={1}>
                          {service.shortTitle}
                        </Text>
                        <Text style={styles.listTagline} numberOfLines={2}>
                          {service.tagline}
                        </Text>

                        <View style={styles.listFooter}>
                          <Text style={styles.listPrice}>
                            {service.startingPrice}
                          </Text>
                          {liveCount && (
                            <Text style={styles.liveCountBadge}>{liveCount}</Text>
                          )}
                          <View style={styles.actionArrowWrap}>
                            <Text style={styles.actionArrowText}>Details →</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              // 2. GRID VIEW (2-column layout)
              <View style={styles.gridContainer}>
                {services.map((service) => {
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={styles.gridCard}
                      onPress={() => handleServicePress(service)}
                      activeOpacity={0.85}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`${service.shortTitle}, ${service.category}, starting ${service.startingPrice.split('/')[0]}, Rating ${service.rating} stars`}
                      accessibilityHint="Double tap to open dedicated service details"
                    >
                      <View
                        style={[
                          styles.gridIconCircle,
                          { backgroundColor: `${service.color}15` },
                        ]}
                        importantForAccessibility="no-hide-descendants"
                        accessibilityElementsHidden={true}
                      >
                        <Text style={styles.gridIconText}>{service.icon}</Text>
                      </View>

                      <View style={styles.gridBadgeWrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
                        <Text
                          style={[
                            styles.gridCategoryText,
                            { color: service.color },
                          ]}
                          numberOfLines={1}
                        >
                          {service.category}
                        </Text>
                      </View>

                      <Text style={styles.gridTitle} numberOfLines={2} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
                        {service.shortTitle}
                      </Text>

                      <Text style={styles.gridRating} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>★ {service.rating}</Text>

                      <View style={styles.gridFooter} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
                        <Text style={styles.gridPrice} numberOfLines={1}>
                          {service.startingPrice.split('/')[0]}
                        </Text>
                        <Text style={styles.gridCta}>Explore →</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Bottom Trip Guarantee Info Card */}
            <View style={styles.guaranteeCard}>
              <Text style={styles.guaranteeIcon}>🛡️</Text>
              <View style={styles.guaranteeTextWrap}>
                <Text style={styles.guaranteeTitle}>The GK WhizWheel Direct Guarantee</Text>
                <Text style={styles.guaranteeDesc}>
                  Zero middleman commissions • Verified local fleet • 24/7 on-call roadside assistance across Uttara Kannada.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleWrap: {
    marginBottom: spacing.md,
  },
  headerBadge: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  togglePillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  toggleButtonActive: {
    backgroundColor: colors.secondary,
    ...shadows.sm,
  },
  toggleButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: colors.textInverted,
    fontWeight: typography.weights.bold,
  },
  loadingScroll: {
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // 1. List View Styles
  listContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  listIconBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  listIconText: {
    fontSize: 28,
  },
  listContent: {
    flex: 1,
  },
  listCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  listCategoryText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  listRatingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primaryDark,
  },
  listTitle: {
    fontSize: typography.sizes.md + 1,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  listTagline: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  listPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },
  liveCountBadge: {
    fontSize: typography.sizes.xs - 1,
    color: colors.accentDark,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    fontWeight: typography.weights.semibold,
  },
  actionArrowWrap: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  actionArrowText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },

  // 2. Grid View Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gridIconText: {
    fontSize: 26,
  },
  gridBadgeWrap: {
    marginBottom: 4,
  },
  gridCategoryText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  gridRating: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  gridFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.xs + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPrice: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    flex: 1,
  },
  gridCta: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },

  // Guarantee Banner
  guaranteeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  guaranteeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  guaranteeTextWrap: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  guaranteeDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
