import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { DEDICATED_SERVICES, ServiceDefinition, ServicePackage } from '../api/servicesData';
import { api } from '../api/client';
import { ServiceItem } from '../api/types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { analyticsService } from '../services/analyticsService';

type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

export const ServiceDetailScreen: React.FC = () => {
  const route = useRoute<ServiceDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { serviceId, serviceSlug, preSelectedDestination } = route.params;

  // Resolve service definition from local catalog
  const serviceKey = serviceId || serviceSlug || 'bikes';
  const service: ServiceDefinition = DEDICATED_SERVICES[serviceKey] || DEDICATED_SERVICES.bikes;

  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [liveItems, setLiveItems] = useState<ServiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    // Track service_viewed funnel milestone
    analyticsService.trackServiceViewed({
      serviceId: service.id,
      serviceSlug: service.slug,
      title: service.title,
      category: service.category,
      startingPrice: service.startingPrice,
    });

    // Fetch any live backend items for this service type
    const fetchLiveItems = async () => {
      setLoadingItems(true);
      try {
        const res = await api.publicApi.getServiceDetail(service.slug);
        if (res.success && res.data?.items) {
          setLiveItems(res.data.items);
        }
      } catch (err) {
        // Fallback to static packages
      } finally {
        setLoadingItems(false);
      }
    };

    fetchLiveItems();
  }, [service.slug]);

  const handleBookingAction = () => {
    if (service.id === 'bikes') {
      // Direct navigation to fleet tab or explore screen
      navigation.navigate('MainTabs');
    } else {
      const promptText = preSelectedDestination
        ? `Hi GK WhizWheels, I would like to plan a Vacation Package tour for ${preSelectedDestination}. Please share package options and availability.`
        : `Hi GK WhizWheels, I am interested in booking ${service.title}.`;

      Alert.alert(
        `Reserve ${service.shortTitle}`,
        preSelectedDestination
          ? `Plan custom tour for ${preSelectedDestination} with our Honnavar trip coordinator?`
          : `Would you like to speak directly with our Honnavar trip coordinator for instant confirmation?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call Helpline',
            onPress: () => Linking.openURL('tel:+919481500000'),
          },
          {
            text: 'WhatsApp Chat',
            onPress: () =>
              Linking.openURL(
                `https://wa.me/919481500000?text=${encodeURIComponent(promptText)}`
              ),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={service.shortTitle}
          subtitle={service.category}
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:+919481500000')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.headerPhoneBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Call support helpline"
              accessibilityHint="Dials GK WhizWheel customer support phone number"
            >
              <Text style={styles.headerPhoneIcon}>📞</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 1. Service Hero Banner */}
          <View style={[styles.heroBox, { backgroundColor: `${service.color}15` }]}>
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.categoryPill,
                  { backgroundColor: `${service.color}25` },
                ]}
              >
                <Text style={[styles.categoryPillText, { color: service.color }]}>
                  {service.category.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.ratingBadge}>
                ★ {service.rating} ({service.reviewCount})
              </Text>
            </View>

            <View style={styles.heroIconWrap}>
              <Text style={styles.heroEmoji}>{service.icon}</Text>
            </View>

            <Text style={styles.heroTitle}>{service.title}</Text>
            <Text style={styles.heroTagline}>{service.tagline}</Text>

            <View style={styles.startingRatePill}>
              <Text style={styles.startingRateLabel}>Starting Tariff:</Text>
              <Text style={styles.startingRateValue}>{service.startingPrice}</Text>
            </View>
          </View>

          {/* Destination Pre-selection Callout Banner */}
          {preSelectedDestination && (
            <View style={styles.destinationBanner}>
              <View style={styles.destHeaderRow}>
                <Text style={styles.destEmoji}>🎯</Text>
                <View style={styles.destBadge}>
                  <Text style={styles.destBadgeText}>Selected Destination</Text>
                </View>
              </View>
              <Text style={styles.destTitle}>{preSelectedDestination}</Text>
              <Text style={styles.destDescription}>
                Your vacation package itinerary will be pre-configured with vehicle transfers, local sightseeing, and dedicated route coordination for this attraction.
              </Text>
            </View>
          )}

          {/* 2. Key Trust Badges */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Service Guarantees</Text>
            <View style={styles.trustGrid}>
              {service.trustBadges.map((badge, idx) => (
                <View key={idx} style={styles.trustCard}>
                  <Text style={styles.trustCardIcon}>✓</Text>
                  <View style={styles.trustCardTextWrap}>
                    <Text style={styles.trustCardTitle}>{badge.title}</Text>
                    <Text style={styles.trustCardDesc}>{badge.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 3. Detailed Overview */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Overview</Text>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewText}>{service.overview}</Text>
            </View>
          </View>

          {/* 4. Packages & Tariff Options */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Available Packages & Rates</Text>
            <View style={styles.packagesWrap}>
              {service.packages.map((pkg, idx) => (
                <View key={idx} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageRate}>{pkg.rate}</Text>
                  </View>
                  <Text style={styles.packageDetails}>{pkg.modelsOrDetails}</Text>
                  <View style={styles.packageIdealWrap}>
                    <Text style={styles.packageIdealLabel}>Ideal for:</Text>
                    <Text style={styles.packageIdealText}>{pkg.idealFor}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Live Backend Items if available */}
          {liveItems.length > 0 && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeader}>Live Fleet & Slot Inventory</Text>
              <View style={styles.liveItemsList}>
                {liveItems.map((item) => (
                  <View key={item.id} style={styles.liveItemCard}>
                    <View style={styles.liveItemHeader}>
                      <Text style={styles.liveItemName}>{item.name}</Text>
                      <Badge
                        label={item.status === 'available' ? 'Ready' : 'Reserved'}
                        variant={item.status === 'available' ? 'success' : 'neutral'}
                      />
                    </View>
                    {item.description && (
                      <Text style={styles.liveItemDesc}>{item.description}</Text>
                    )}
                    <Text style={styles.liveItemPrice}>
                      ₹{item.price_base} <Text style={styles.liveItemUnit}>/{item.price_unit}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 5. Inclusions & Exclusions */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Inclusions & Clear Policies</Text>
            <View style={styles.policiesCard}>
              <Text style={styles.policySubHeader}>What is included:</Text>
              {service.inclusions.map((item, i) => (
                <View key={i} style={styles.policyRow}>
                  <Text style={styles.inclusionIcon}>✓</Text>
                  <Text style={styles.policyText}>{item}</Text>
                </View>
              ))}

              <View style={styles.policyDivider} />

              <Text style={[styles.policySubHeader, { color: colors.danger }]}>
                What is excluded:
              </Text>
              {service.exclusions.map((item, i) => (
                <View key={i} style={styles.policyRow}>
                  <Text style={styles.exclusionIcon}>✕</Text>
                  <Text style={styles.policyText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 6. Expandable FAQs */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader} accessible={true} accessibilityRole="header">Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {service.faqs.map((faq, index) => {
                const isExpanded = expandedFaqIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.faqItem}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                    activeOpacity={0.8}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Question: ${faq.q}`}
                    accessibilityState={{ expanded: isExpanded }}
                    accessibilityHint="Double tap to expand or collapse this FAQ answer"
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={styles.faqQuestionText}>{faq.q}</Text>
                      <Text style={styles.faqToggleIcon}>{isExpanded ? '−' : '+'}</Text>
                    </View>
                    {isExpanded && <Text style={styles.faqAnswerText}>{faq.a}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Booking Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceWrap}>
            <Text style={styles.bottomPriceLabel}>Starting from</Text>
            <Text style={styles.bottomPriceValue}>
              {service.startingPrice.split('/')[0]}
              <Text style={styles.bottomPriceUnit}>/{service.startingPrice.split('/')[1] || 'day'}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bookingButton, { backgroundColor: colors.primary }]}
            onPress={handleBookingAction}
            activeOpacity={0.88}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={service.id === 'bikes' ? 'Browse Bikes' : `Reserve ${service.shortTitle}`}
            accessibilityHint="Opens booking or bike exploration flow"
          >
            <Text style={styles.bookingButtonText}>
              {service.id === 'bikes' ? 'Browse Bikes →' : 'Reserve Service →'}
            </Text>
          </TouchableOpacity>
        </View>
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
  headerPhoneBtn: {
    padding: spacing.xs,
  },
  headerPhoneIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 90,
  },

  // 1. Hero Box
  heroBox: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    alignItems: 'center',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  categoryPillText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  ratingBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroEmoji: {
    fontSize: 38,
  },
  heroTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroTagline: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  startingRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  startingRateLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  startingRateValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },

  // Section Layouts
  sectionWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    fontSize: typography.sizes.md + 1,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // 2. Trust Grid
  trustGrid: {
    gap: spacing.sm,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  trustCardIcon: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: colors.accent,
    marginRight: spacing.md,
  },
  trustCardTextWrap: {
    flex: 1,
  },
  trustCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  trustCardDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // 3. Overview
  overviewCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  overviewText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // 4. Packages
  packagesWrap: {
    gap: spacing.md,
  },
  packageCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  packageName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    flex: 1,
  },
  packageRate: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },
  packageDetails: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  packageIdealWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  packageIdealLabel: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  packageIdealText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    flex: 1,
  },

  // Live items
  liveItemsList: {
    gap: spacing.sm,
  },
  liveItemCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  liveItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  liveItemName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  liveItemDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  liveItemPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  liveItemUnit: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },

  // 5. Inclusions & Exclusions
  policiesCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  policySubHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accentDark,
    marginBottom: spacing.sm,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inclusionIcon: {
    color: colors.accent,
    fontWeight: typography.weights.bold,
    fontSize: 14,
    marginRight: spacing.sm,
  },
  exclusionIcon: {
    color: colors.danger,
    fontWeight: typography.weights.bold,
    fontSize: 12,
    marginRight: spacing.sm,
  },
  policyText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  policyDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  // 6. FAQs
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  faqToggleIcon: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  faqAnswerText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  // Sticky Bottom Action Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.modal,
  },
  bottomPriceWrap: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
  },
  bottomPriceValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  bottomPriceUnit: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
  },
  bookingButton: {
    flex: 1.2,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  bookingButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },
  destinationBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.warningLight,
    borderWidth: 1.5,
    borderColor: colors.warningDark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  destHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  destEmoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  destBadge: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningDark,
  },
  destBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.secondary,
    marginBottom: 4,
  },
  destDescription: {
    fontSize: typography.sizes.xs,
    color: colors.warningText,
    lineHeight: 18,
  },
});
