import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Bike } from '../api/types';
import { api } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { analyticsService } from '../services/analyticsService';

type BikeDetailRouteProp = RouteProp<RootStackParamList, 'BikeDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_IMAGE_WIDTH = SCREEN_WIDTH;

export const BikeDetailScreen: React.FC = () => {
  const route = useRoute<BikeDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { bikeId, bike: initialBike } = route.params;

  const [bike, setBike] = useState<Bike | null>(initialBike || null);
  const [loading, setLoading] = useState(!initialBike);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!bike) {
      api.get<Bike>(`/bikes/${bikeId}`).then((res) => {
        if (res.success && res.data) {
          setBike(res.data);
        }
        setLoading(false);
      });
    }
  }, [bikeId]);

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_IMAGE_WIDTH);
    setActiveImageIndex(index);
  };

  if (loading || !bike) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading vehicle specifications...</Text>
      </View>
    );
  }

  const isAvailable = bike.status === 'available';
  const dailyRate = Number(bike.daily_rate || bike.category?.base_daily_rate || 500);

  // Native swipeable gallery angles
  const gallerySlides = [
    { title: 'Full Side View', icon: '🏍️', tag: 'Exterior Profile' },
    { title: 'Front Cockpit & Console', icon: '⚡', tag: 'Instrument Cluster' },
    { title: 'Clean Engine & Exhaust', icon: '⚙️', tag: 'Fully Serviced' },
    { title: 'Sanitized Helmets & Gear', icon: '🪖', tag: 'Free Inclusions' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={bike.model_name}
          subtitle={`${bike.brand} • ${bike.category?.name || 'Two-Wheeler'}`}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Native Swipeable Image Carousel Gallery */}
          <View
            style={styles.carouselContainer}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={`${bike.brand} ${bike.model_name} image gallery, slide ${activeImageIndex + 1} of ${gallerySlides.length}`}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleCarouselScroll}
              scrollEventThrottle={16}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              {gallerySlides.map((slide, index) => (
                <View key={index} style={styles.carouselSlide}>
                  <View style={styles.slideIconWrap}>
                    <Text style={styles.slideIcon}>{slide.icon}</Text>
                  </View>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <View style={styles.slideTagWrap}>
                    <Text style={styles.slideTagText}>{slide.tag}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Carousel Overlay Badges */}
            <View
              style={styles.carouselBadgeRow}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Badge
                label={isAvailable ? 'Ready for Pickup' : 'Currently Booked'}
                variant={isAvailable ? 'success' : 'neutral'}
              />
              <View style={styles.indexCounterBadge}>
                <Text style={styles.indexCounterText}>
                  {activeImageIndex + 1} / {gallerySlides.length}
                </Text>
              </View>
            </View>

            {/* Carousel 4-Dot Indicator */}
            <View
              style={styles.carouselDotsRow}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              {gallerySlides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.carouselDot,
                    activeImageIndex === i && styles.carouselDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* 2. Vehicle Overview Header */}
          <View style={styles.infoCard} accessible={true} accessibilityRole="text">
            <View style={styles.infoHeaderRow}>
              <View style={styles.modelTitleWrap}>
                <Text style={styles.brandTitle}>{bike.brand}</Text>
                <Text style={styles.modelTitle}>{bike.model_name}</Text>
              </View>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{bike.registration_number}</Text>
              </View>
            </View>

            <View style={styles.locationStrip}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>
                {bike.store?.name || 'Honnavar Railway Station Hub'}
              </Text>
            </View>
          </View>

          {/* 3. Detailed Transparent Pricing Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">
              Transparent Pricing Breakdown
            </Text>

            <View style={styles.pricingBreakdownRow}>
              <View>
                <Text style={styles.pricingItemName}>Base Daily Rental Tariff</Text>
                <Text style={styles.pricingItemSub}>24-Hour calendar rental cycle</Text>
              </View>
              <Text style={styles.pricingItemAmount}>₹{dailyRate}</Text>
            </View>

            <View style={styles.pricingDivider} />

            <View style={styles.pricingBreakdownRow}>
              <View>
                <Text style={styles.pricingItemName}>Refundable Security Deposit</Text>
                <Text style={styles.pricingItemSub}>
                  Returned within 2 hrs upon safe return
                </Text>
              </View>
              <View style={styles.depositPill}>
                <Text style={styles.depositPillText}>₹1,000</Text>
              </View>
            </View>

            <View style={styles.pricingDivider} />

            <View style={styles.pricingBreakdownRow}>
              <View>
                <Text style={styles.pricingItemName}>2 ISI Helmets & Mobile Mount</Text>
                <Text style={styles.pricingItemSub}>Sanitized and fitted at station</Text>
              </View>
              <Text style={styles.pricingFreeText}>FREE</Text>
            </View>

            <View style={styles.pricingDivider} />

            <View style={styles.pricingBreakdownRow}>
              <View>
                <Text style={styles.pricingItemName}>Commercial Comprehensive Cover</Text>
                <Text style={styles.pricingItemSub}>Third-party liability & legal permits</Text>
              </View>
              <Text style={styles.pricingFreeText}>INCLUDED</Text>
            </View>

            <View style={styles.totalEstimatedRow}>
              <Text style={styles.totalEstimatedLabel}>Estimated Daily Total</Text>
              <Text style={styles.totalEstimatedValue}>
                ₹{dailyRate} <Text style={styles.perDayText}>/ day</Text>
              </Text>
            </View>
          </View>

          {/* 4. Vehicle Specifications Grid */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">
              Technical Specifications
            </Text>
            <View style={styles.specsGrid}>
              <View
                style={styles.specBox}
                accessible={true}
                accessibilityLabel={`Transmission: ${bike.transmission}`}
              >
                <Text style={styles.specLabel}>TRANSMISSION</Text>
                <Text style={styles.specValue}>⚡ {bike.transmission}</Text>
              </View>
              <View
                style={styles.specBox}
                accessible={true}
                accessibilityLabel={`Fuel Type: ${bike.fuel_type}`}
              >
                <Text style={styles.specLabel}>FUEL TYPE</Text>
                <Text style={styles.specValue}>⛽ {bike.fuel_type}</Text>
              </View>
              <View
                style={styles.specBox}
                accessible={true}
                accessibilityLabel={`Category: ${bike.category?.name || 'Commuter'}`}
              >
                <Text style={styles.specLabel}>CATEGORY</Text>
                <Text style={styles.specValue}>
                  🏷️ {bike.category?.name || 'Commuter'}
                </Text>
              </View>
              <View
                style={styles.specBox}
                accessible={true}
                accessibilityLabel="RTO Legal Status: Commercial RC"
              >
                <Text style={styles.specLabel}>RTO LEGAL STATUS</Text>
                <Text style={styles.specValue}>🛡️ Commercial RC</Text>
              </View>
            </View>
          </View>

          {/* 5. What's Included */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">
              Complimentary Trip Inclusions
            </Text>
            <View style={styles.inclusionList}>
              <View style={styles.inclusionRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.inclusionText}>
                  2 Sanitized ISI certified helmets (Driver + Pillion)
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.inclusionText}>
                  Waterproof mobile handlebar holder with charging cable
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.inclusionText}>
                  24/7 Roadside breakdown & flat-tire mobile rescue
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.inclusionText}>
                  Full tank assistance & station platform handover in 3 minutes
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 6. Sticky Bottom "Book Now" Button Always Visible While Scrolling */}
        <View style={styles.stickyBottomBar}>
          <View style={styles.stickyPriceWrap}>
            <Text style={styles.stickyPriceLabel}>Daily Rental Tariff</Text>
            <Text style={styles.stickyPriceValue}>
              ₹{dailyRate}
              <Text style={styles.stickyPriceUnit}> / day</Text>
            </Text>
            <Text style={styles.stickyDepositNote}>+ ₹1,000 refundable deposit</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.bookNowButton,
              !isAvailable && styles.bookNowButtonDisabled,
            ]}
            onPress={() => {
              analyticsService.trackBookingStarted({
                bikeId: bike.id,
                bikeName: bike.model_name,
                dailyRate,
                storeId: bike.current_store_id,
                storeName: bike.store?.name,
              });
              navigation.navigate('Checkout', { bikeId: bike.id, bike });
            }}
            activeOpacity={0.88}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${isAvailable ? 'Book Now' : 'Reserve Ahead'} for ${bike.brand} ${bike.model_name}, ${dailyRate} rupees per day`}
            accessibilityHint="Navigates to checkout to select dates and pickup location"
          >
            <Text style={styles.bookNowText}>
              {isAvailable ? 'Book Now →' : 'Reserve Ahead →'}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 110, // Generous padding so content never gets hidden behind sticky bottom bar
  },

  // 1. Native Image Carousel Gallery
  carouselContainer: {
    backgroundColor: colors.card,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  carouselSlide: {
    width: CAROUSEL_IMAGE_WIDTH,
    height: 220,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  slideIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  slideIcon: {
    fontSize: 42,
  },
  slideTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  slideTagWrap: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slideTagText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  carouselBadgeRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indexCounterBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  indexCounterText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.textInverted,
  },
  carouselDotsRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  carouselDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  // 2. Info Card
  infoCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  infoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modelTitleWrap: {
    flex: 1,
  },
  brandTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modelTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginTop: 2,
  },
  plateBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plateText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  locationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  locationText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  // 3. Pricing Breakdown Card
  sectionCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  pricingBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pricingItemName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  pricingItemSub: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    marginTop: 1,
  },
  pricingItemAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  pricingFreeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: colors.accentDark,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  depositPill: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  depositPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  totalEstimatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1.5,
    borderTopColor: colors.primaryLight,
  },
  totalEstimatedLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  totalEstimatedValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },
  perDayText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
  },

  // 4. Specifications Grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specBox: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  specLabel: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: 'capitalize',
  },

  // 5. Inclusions
  inclusionList: {
    gap: spacing.sm,
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIcon: {
    fontSize: 14,
    color: colors.accentDark,
    fontWeight: typography.weights.bold,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  inclusionText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  // 6. Sticky Bottom "Book Now" Button Always Visible
  stickyBottomBar: {
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
  stickyPriceWrap: {
    flex: 1,
  },
  stickyPriceLabel: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stickyPriceValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  stickyPriceUnit: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
  },
  stickyDepositNote: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  bookNowButton: {
    flex: 1.1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  bookNowButtonDisabled: {
    backgroundColor: colors.borderDark,
  },
  bookNowText: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },
});
