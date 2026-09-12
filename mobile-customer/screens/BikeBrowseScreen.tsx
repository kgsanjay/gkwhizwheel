import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { RootStackParamList } from '../navigation/types';
import { Bike, BikeCategory, Store } from '../api/types';
import { api } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { BikeCard } from '../components/BikeCard';

type BikeBrowseRouteProp = RouteProp<RootStackParamList, 'BikeBrowse'>;

export const BikeBrowseScreen: React.FC = () => {
  const route = useRoute<BikeBrowseRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Initial params
  const initialCatId = route.params?.categoryId ?? null;
  const initialStoreId = route.params?.storeId ?? null;
  const initialSearch = route.params?.search ?? '';

  // Data
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [categories, setCategories] = useState<BikeCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Applied Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCatId);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(initialStoreId);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Draft filters inside bottom sheet
  const [draftCategoryId, setDraftCategoryId] = useState<number | null>(initialCatId);
  const [draftStoreId, setDraftStoreId] = useState<number | null>(initialStoreId);
  const [draftMaxPrice, setDraftMaxPrice] = useState<number | null>(null);
  const [draftOnlyAvailable, setDraftOnlyAvailable] = useState<boolean>(false);

  // BottomSheet Setup
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState<number>(-1);
  const snapPoints = useMemo(() => ['65%', '90%'], []);

  const openFilterSheet = () => {
    setDraftCategoryId(selectedCategoryId);
    setDraftStoreId(selectedStoreId);
    setDraftMaxPrice(maxPrice);
    setDraftOnlyAvailable(onlyAvailable);
    setSheetIndex(0);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeFilterSheet = () => {
    setSheetIndex(-1);
    bottomSheetRef.current?.close();
  };

  const applyFilters = () => {
    setSelectedCategoryId(draftCategoryId);
    setSelectedStoreId(draftStoreId);
    setMaxPrice(draftMaxPrice);
    setOnlyAvailable(draftOnlyAvailable);
    closeFilterSheet();
  };

  const resetFilters = () => {
    setDraftCategoryId(null);
    setDraftStoreId(null);
    setDraftMaxPrice(null);
    setDraftOnlyAvailable(false);
    setSelectedCategoryId(null);
    setSelectedStoreId(null);
    setMaxPrice(null);
    setOnlyAvailable(false);
    closeFilterSheet();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const fetchData = async () => {
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
    } catch (err) {
      console.warn('Error fetching browse bikes data', err);
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

  // Filtered bikes
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
      selectedStoreId === null || bike.current_store_id === selectedStoreId;

    const dailyRate = Number(bike.daily_rate || bike.category?.base_daily_rate || 500);
    const matchesPrice = maxPrice === null || dailyRate <= maxPrice;

    const matchesAvailability = !onlyAvailable || bike.status === 'available';

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStore &&
      matchesPrice &&
      matchesAvailability
    );
  });

  // Calculate active filter count
  const activeFilterCount =
    (selectedCategoryId !== null ? 1 : 0) +
    (selectedStoreId !== null ? 1 : 0) +
    (maxPrice !== null ? 1 : 0) +
    (onlyAvailable ? 1 : 0);

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);
  const selectedStoreObj = stores.find((s) => s.id === selectedStoreId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Honda, Royal Enfield..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Filter Button with badge */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeFilterCount > 0 && styles.filterBtnActive,
            ]}
            onPress={openFilterSheet}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Filter bikes${activeFilterCount > 0 ? `, ${activeFilterCount} active filters applied` : ''}`}
            accessibilityHint="Opens bottom sheet with category, price, and hub location filters"
          >
            <Text style={styles.filterBtnIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>⚙️</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsContainer}
            accessibilityRole="toolbar"
          >
            {selectedCategoryObj && (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>Category: {selectedCategoryObj.name}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedCategoryId(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove filter for category ${selectedCategoryObj.name}`}
                >
                  <Text style={styles.activeChipClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedStoreObj && (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>Hub: {selectedStoreObj.name}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedStoreId(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove filter for hub ${selectedStoreObj.name}`}
                >
                  <Text style={styles.activeChipClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {maxPrice !== null && (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>Up to ₹{maxPrice}/day</Text>
                <TouchableOpacity
                  onPress={() => setMaxPrice(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove filter for max tariff ${maxPrice} rupees`}
                >
                  <Text style={styles.activeChipClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {onlyAvailable && (
              <View style={styles.activeChip}>
                <Text style={styles.activeChipText}>Available Only</Text>
                <TouchableOpacity
                  onPress={() => setOnlyAvailable(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Remove filter for available only"
                >
                  <Text style={styles.activeChipClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.clearAllChip}
              onPress={resetFilters}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Results Bar */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            Showing <Text style={styles.resultsHighlight}>{filteredBikes.length}</Text> bikes
          </Text>
          <TouchableOpacity
            onPress={openFilterSheet}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Filter options"
            accessibilityHint="Opens bottom sheet filter panel"
          >
            <Text style={styles.filterActionLink}>Filter Options</Text>
          </TouchableOpacity>
        </View>

        {/* Main Bike List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching available bikes...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBikes}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <BikeCard
                bike={item}
                onPress={() =>
                  navigation.navigate('BikeDetail', { bikeId: item.id, bike: item })
                }
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛵</Text>
                <Text style={styles.emptyTitle}>No matching bikes</Text>
                <Text style={styles.emptySubtitle}>
                  Try relaxing your category or price filters to see more vehicles.
                </Text>
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                  <Text style={styles.resetBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Native Bottom-Sheet Filter Panel (@gorhom/bottom-sheet) */}
        <BottomSheet
          ref={bottomSheetRef}
          index={sheetIndex}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          onClose={() => setSheetIndex(-1)}
          handleIndicatorStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBackground}
        >
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle} accessible={true} accessibilityRole="header">Filter Bikes</Text>
              <TouchableOpacity
                onPress={closeFilterSheet}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close filter panel"
              >
                <Text style={styles.sheetClose}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* 1. Category Filter */}
            <Text style={styles.filterSectionTitle} accessible={true} accessibilityRole="header">Vehicle Category</Text>
            <View style={styles.pillsWrap} accessibilityRole="tablist">
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  draftCategoryId === null && styles.filterPillActive,
                ]}
                onPress={() => setDraftCategoryId(null)}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="All Categories"
                accessibilityState={{ selected: draftCategoryId === null }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    draftCategoryId === null && styles.filterPillTextActive,
                  ]}
                >
                  All Categories
                </Text>
              </TouchableOpacity>

              {categories.map((cat) => {
                const isSelected = draftCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterPill, isSelected && styles.filterPillActive]}
                    onPress={() => setDraftCategoryId(isSelected ? null : cat.id)}
                    accessible={true}
                    accessibilityRole="tab"
                    accessibilityLabel={`Category: ${cat.name}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected && styles.filterPillTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Price Range Filter */}
            <Text style={styles.filterSectionTitle} accessible={true} accessibilityRole="header">Daily Tariff Budget</Text>
            <View style={styles.pillsWrap} accessibilityRole="tablist">
              {[
                { label: 'Any Tariff', value: null },
                { label: 'Under ₹500/day', value: 500 },
                { label: 'Under ₹1,000/day', value: 1000 },
                { label: 'Under ₹1,500/day', value: 1500 },
              ].map((tier) => {
                const isSelected = draftMaxPrice === tier.value;
                return (
                  <TouchableOpacity
                    key={tier.label}
                    style={[styles.filterPill, isSelected && styles.filterPillActive]}
                    onPress={() => setDraftMaxPrice(tier.value)}
                    accessible={true}
                    accessibilityRole="tab"
                    accessibilityLabel={`Budget: ${tier.label}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        isSelected && styles.filterPillTextActive,
                      ]}
                    >
                      {tier.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Availability Filter */}
            <Text style={styles.filterSectionTitle} accessible={true} accessibilityRole="header">Availability Status</Text>
            <View style={styles.pillsWrap} accessibilityRole="tablist">
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  !draftOnlyAvailable && styles.filterPillActive,
                ]}
                onPress={() => setDraftOnlyAvailable(false)}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="All Fleet"
                accessibilityState={{ selected: !draftOnlyAvailable }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    !draftOnlyAvailable && styles.filterPillTextActive,
                  ]}
                >
                  All Fleet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  draftOnlyAvailable && styles.filterPillActive,
                ]}
                onPress={() => setDraftOnlyAvailable(true)}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="Ready for Pickup Only"
                accessibilityState={{ selected: draftOnlyAvailable }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    draftOnlyAvailable && styles.filterPillTextActive,
                  ]}
                >
                  Ready for Pickup Only
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4. Store Hub Location */}
            {stores.length > 0 && (
              <>
                <Text style={styles.filterSectionTitle} accessible={true} accessibilityRole="header">Pickup Hub</Text>
                <View style={styles.pillsWrap} accessibilityRole="tablist">
                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      draftStoreId === null && styles.filterPillActive,
                    ]}
                    onPress={() => setDraftStoreId(null)}
                    accessible={true}
                    accessibilityRole="tab"
                    accessibilityLabel="All Honnavar Hubs"
                    accessibilityState={{ selected: draftStoreId === null }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        draftStoreId === null && styles.filterPillTextActive,
                      ]}
                    >
                      All Honnavar Hubs
                    </Text>
                  </TouchableOpacity>
                  {stores.map((store) => {
                    const isSelected = draftStoreId === store.id;
                    return (
                      <TouchableOpacity
                        key={store.id}
                        style={[styles.filterPill, isSelected && styles.filterPillActive]}
                        onPress={() => setDraftStoreId(isSelected ? null : store.id)}
                        accessible={true}
                        accessibilityRole="tab"
                        accessibilityLabel={`Hub: ${store.name}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            isSelected && styles.filterPillTextActive,
                          ]}
                        >
                          📍 {store.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Sheet Actions */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={styles.sheetResetButton}
                onPress={resetFilters}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Reset all filters"
              >
                <Text style={styles.sheetResetText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetApplyButton}
                onPress={applyFilters}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
                accessibilityHint="Updates bike list with selected criteria"
              >
                <Text style={styles.sheetApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    height: 42,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  filterBtnIcon: {
    fontSize: 18,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },
  activeChipsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.xs,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  activeChipText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  activeChipClose: {
    fontSize: 12,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
    marginLeft: 2,
  },
  clearAllChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  resultsHighlight: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterActionLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  centerContainer: {
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
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  resetBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  resetBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textInverted,
  },

  // BottomSheet Styles
  sheetBackground: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  sheetHandle: {
    backgroundColor: colors.borderDark,
    width: 44,
  },
  sheetContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sheetClose: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  filterSectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  filterPillTextActive: {
    color: colors.textInverted,
    fontWeight: typography.weights.bold,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  sheetResetButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetResetText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  sheetApplyButton: {
    flex: 1.5,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  sheetApplyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },
});
