import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Bike, BikeCategory, Store } from '../api/types';
import { api } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { BikeCard } from '../components/BikeCard';

// 3-step condensed mobile stepper data
const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Choose Bike & Hub',
    description: 'Select your preferred ride from our verified legal fleet and choose your pickup hub in Honnavar.',
    icon: '🛵',
    tag: 'Verified Fleet',
  },
  {
    step: 2,
    title: 'Instant Online Hold',
    description: 'Lock your booking in under 60 seconds with transparent daily tariffs and zero hidden fees.',
    icon: '⚡',
    tag: '60s Reservation',
  },
  {
    step: 3,
    title: 'Station Pickup & Ride',
    description: 'Rapid 3-minute handover at Honnavar Station or Palya Main Rd with 24/7 roadside assistance.',
    icon: '🔑',
    tag: '24/7 Road Support',
  },
];

const getCategoryIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('scooter') || lower.includes('activa')) return '🛵';
  if (lower.includes('cruiser') || lower.includes('bullet') || lower.includes('enfield')) return '🏍️';
  if (lower.includes('electric') || lower.includes('ev')) return '⚡';
  if (lower.includes('sport')) return '🏁';
  return '🚲';
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const flatListRef = useRef<FlatList>(null);

  // API Data
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [categories, setCategories] = useState<BikeCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Filter States
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const fetchData = async () => {
    setError(null);
    try {
      const [bikesRes, categoriesRes, storesRes] = await Promise.all([
        api.publicApi.getBikes(),
        api.publicApi.getBikeCategories(),
        api.publicApi.getStores(),
      ]);

      if (bikesRes.success && Array.isArray(bikesRes.data)) {
        setBikes(bikesRes.data);
      }
      if (categoriesRes.success && Array.isArray(categoriesRes.data)) {
        setCategories(categoriesRes.data);
      }
      if (storesRes.success && Array.isArray(storesRes.data)) {
        setStores(storesRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load home screen data', err);
      setError(err?.message || 'Unable to connect to service. Please check your network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Navigate to native BikeBrowse flow with bottom-sheet filter panel
  const handleBookBikePress = () => {
    navigation.navigate('BikeBrowse', { categoryId: selectedCategoryId || undefined });
  };

  // Filtered bikes logic
  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch =
      searchQuery === '' ||
      bike.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bike.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryId === null ||
      bike.category_id === selectedCategoryId ||
      bike.category?.id === selectedCategoryId;

    const matchesStore =
      selectedStoreId === null ||
      bike.current_store_id === selectedStoreId;

    return matchesSearch && matchesCategory && matchesStore;
  });

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);
  const currentStepData = HOW_IT_WORKS_STEPS[activeStep];

  // List Header Component contains Hero, Category Carousel, and How It Works Stepper
  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      {/* 1. Compact Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>📍 HONNAVAR, KARNATAKA</Text>
          </View>
          <Text style={styles.heroFleetBadge}>24/7 Support</Text>
        </View>

        <Text style={styles.heroTitle}>Explore Coastal Karnataka on Two Wheels</Text>
        <Text style={styles.heroSubtitle}>
          Legal Govt. approved fleet • 3-min station pickup • Zero hidden charges
        </Text>

        {/* Single Primary CTA */}
        <TouchableOpacity
          style={styles.heroCtaButton}
          onPress={handleBookBikePress}
          activeOpacity={0.88}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Book a Bike"
          accessibilityHint="Opens bike browsing and filter panel"
        >
          <Text style={styles.heroCtaText}>Book a Bike</Text>
          <Text style={styles.heroCtaArrow} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Horizontally Scrollable Service Category Carousel */}
      <View style={styles.sectionHeader} accessible={true} accessibilityRole="header">
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <Text style={styles.sectionSubtitle}>Swipe horizontally to filter fleet</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryCarouselContent}
        style={styles.categoryCarousel}
        accessibilityRole="tablist"
      >
        {/* "All Fleet" option */}
        <TouchableOpacity
          style={[
            styles.categoryCard,
            selectedCategoryId === null && styles.categoryCardActive,
          ]}
          onPress={() => setSelectedCategoryId(null)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel={`All Fleet, ${bikes.length} bikes available`}
          accessibilityState={{ selected: selectedCategoryId === null }}
          accessibilityHint="Shows all available bikes across categories"
        >
          <View
            style={[
              styles.categoryIconCircle,
              selectedCategoryId === null && styles.categoryIconCircleActive,
            ]}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          >
            <Text style={styles.categoryIconText}>🌟</Text>
          </View>
          <Text
            style={[
              styles.categoryName,
              selectedCategoryId === null && styles.categoryNameActive,
            ]}
            numberOfLines={1}
          >
            All Fleet
          </Text>
          <Text style={styles.categoryRate}>{bikes.length} Bikes</Text>
        </TouchableOpacity>

        {/* Real categories from API */}
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const icon = getCategoryIcon(category.name);
          const baseRate = Math.round(Number(category.base_daily_rate) || 450);
          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
              onPress={() => setSelectedCategoryId(isSelected ? null : category.id)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={`Category ${category.name}, from ${baseRate} rupees per day`}
              accessibilityState={{ selected: isSelected }}
              accessibilityHint="Filters available fleet to this category"
            >
              <View
                style={[
                  styles.categoryIconCircle,
                  isSelected && styles.categoryIconCircleActive,
                ]}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden={true}
              >
                <Text style={styles.categoryIconText}>{icon}</Text>
              </View>
              <Text
                style={[styles.categoryName, isSelected && styles.categoryNameActive]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
              <Text style={styles.categoryRate}>
                From ₹{baseRate}/d
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Condensed "How It Works" 3-Dot Horizontal Stepper */}
      <View style={styles.sectionHeader} accessible={true} accessibilityRole="header">
        <View style={styles.stepperHeaderRow}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step {currentStepData.step} of 3</Text>
          </View>
        </View>
      </View>

      <View
        style={styles.stepperCard}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Step ${currentStepData.step} of 3: ${currentStepData.title}. ${currentStepData.description}`}
      >
        <View style={styles.stepperCardHeader} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
          <View style={styles.stepperIconWrap}>
            <Text style={styles.stepperIconText}>{currentStepData.icon}</Text>
          </View>
          <View style={styles.stepperTitleWrap}>
            <Text style={styles.stepperStepTitle}>{currentStepData.title}</Text>
            <Text style={styles.stepperStepTag}>✓ {currentStepData.tag}</Text>
          </View>
        </View>

        <Text style={styles.stepperDescription} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
          {currentStepData.description}
        </Text>

        {/* 3-Dot Horizontal Indicator with Step Control */}
        <View style={styles.stepperDotsContainer}>
          <TouchableOpacity
            style={[styles.stepperArrow, activeStep === 0 && styles.stepperArrowDisabled]}
            disabled={activeStep === 0}
            onPress={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Previous how it works step"
            accessibilityState={{ disabled: activeStep === 0 }}
          >
            <Text style={[styles.arrowText, activeStep === 0 && styles.arrowTextDisabled]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.dotsRow}>
            {HOW_IT_WORKS_STEPS.map((stepItem, index) => {
              const isActive = activeStep === index;
              return (
                <TouchableOpacity
                  key={stepItem.step}
                  style={[styles.stepperDot, isActive && styles.stepperDotActive]}
                  onPress={() => setActiveStep(index)}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to step ${stepItem.step}: ${stepItem.title}`}
                  accessibilityState={{ selected: isActive }}
                />
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.stepperArrow,
              activeStep === HOW_IT_WORKS_STEPS.length - 1 && styles.stepperArrowDisabled,
            ]}
            disabled={activeStep === HOW_IT_WORKS_STEPS.length - 1}
            onPress={() =>
              setActiveStep((prev) => Math.min(HOW_IT_WORKS_STEPS.length - 1, prev + 1))
            }
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Next how it works step"
            accessibilityState={{ disabled: activeStep === HOW_IT_WORKS_STEPS.length - 1 }}
          >
            <Text
              style={[
                styles.arrowText,
                activeStep === HOW_IT_WORKS_STEPS.length - 1 && styles.arrowTextDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Fleet Filter & Search Section */}
      <View style={styles.fleetHeaderSection}>
        <View style={styles.fleetHeaderTitleRow}>
          <Text style={styles.fleetHeaderTitle}>Available Fleet</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('BikeBrowse', { categoryId: selectedCategoryId || undefined })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Open filter panel and view all ${bikes.length} bikes`}
            accessibilityHint="Opens the bottom sheet filter modal"
          >
            <Text style={{ fontSize: typography.sizes.xs, color: colors.primaryDark, fontWeight: typography.weights.bold }}>
              Filter Panel & All ({bikes.length}) →
            </Text>
          </TouchableOpacity>
        </View>

        {selectedCategoryObj && (
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>
              Category: {selectedCategoryObj.name}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedCategoryId(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Remove filter for category ${selectedCategoryObj.name}`}
            >
              <Text style={styles.clearFilterText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Honda Activa, Royal Enfield..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            accessible={true}
            accessibilityRole="search"
            accessibilityLabel="Search bikes and models"
            accessibilityHint="Filters bikes by brand or model name"
          />
        </View>

        {/* Store selector pills */}
        {stores.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storePillsScroll}
            accessibilityRole="tablist"
          >
            <TouchableOpacity
              style={[styles.storePill, selectedStoreId === null && styles.storePillActive]}
              onPress={() => setSelectedStoreId(null)}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="All Hubs"
              accessibilityState={{ selected: selectedStoreId === null }}
            >
              <Text
                style={[
                  styles.storePillText,
                  selectedStoreId === null && styles.storePillTextActive,
                ]}
              >
                All Hubs
              </Text>
            </TouchableOpacity>
            {stores.map((store) => {
              const isSelected = selectedStoreId === store.id;
              return (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.storePill, isSelected && styles.storePillActive]}
                  onPress={() => setSelectedStoreId(isSelected ? null : store.id)}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={`Pickup Hub: ${store.name}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[styles.storePillText, isSelected && styles.storePillTextActive]}
                  >
                    📍 {store.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading fleet & categories...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Unable to load fleet</Text>
            <Text style={styles.errorDescription}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredBikes}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <BikeCard
                bike={item}
                onPress={() => navigation.navigate('BikeDetail', { bikeId: item.id, bike: item })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛵</Text>
                <Text style={styles.emptyTitle}>No bikes available</Text>
                <Text style={styles.emptySubtitle}>
                  Try clearing the category filter or searching for another vehicle model.
                </Text>
                {(selectedCategoryId !== null || selectedStoreId !== null || searchQuery !== '') && (
                  <TouchableOpacity
                    style={styles.resetFilterButton}
                    onPress={() => {
                      setSelectedCategoryId(null);
                      setSelectedStoreId(null);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={styles.resetFilterText}>Reset All Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
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
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  headerWrapper: {
    backgroundColor: colors.background,
  },

  // 1. Compact Hero Card
  heroCard: {
    backgroundColor: colors.secondary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  locationBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryHover,
    letterSpacing: 0.5,
  },
  heroFleetBadge: {
    fontSize: typography.sizes.xs,
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
  heroTitle: {
    fontSize: typography.sizes.xl + 1,
    fontWeight: typography.weights.heavy,
    color: colors.textInverted,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.borderDark,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  heroCtaButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  heroCtaText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
    marginRight: spacing.sm,
  },
  heroCtaArrow: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },

  // Section Headers
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 2. Horizontally Scrollable Category Carousel
  categoryCarousel: {
    marginBottom: spacing.xl,
  },
  categoryCarouselContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryCard: {
    width: 125,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  categoryCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryIconCircleActive: {
    backgroundColor: colors.card,
  },
  categoryIconText: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryNameActive: {
    color: colors.primaryDark,
  },
  categoryRate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },

  // 3. Condensed "How It Works" 3-Dot Horizontal Stepper
  stepperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  stepBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  stepperCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  stepperCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepperIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepperIconText: {
    fontSize: 22,
  },
  stepperTitleWrap: {
    flex: 1,
  },
  stepperStepTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  stepperStepTag: {
    fontSize: typography.sizes.xs,
    color: colors.accentDark,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  stepperDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  stepperDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stepperArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperArrowDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: -2,
  },
  arrowTextDisabled: {
    color: colors.textMuted,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardBorder,
  },
  stepperDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // 4. Fleet Section Header & Filters
  fleetHeaderSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  fleetHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fleetHeaderTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  fleetCountBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    backgroundColor: colors.divider,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  activeFilterText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  clearFilterText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
    marginLeft: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  storePillsScroll: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  storePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  storePillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  storePillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  storePillTextActive: {
    color: colors.textInverted,
    fontWeight: typography.weights.bold,
  },

  // Loading & Empty States
  loadingContainer: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  errorDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },
  emptyContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resetFilterButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  resetFilterText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textInverted,
  },
});
