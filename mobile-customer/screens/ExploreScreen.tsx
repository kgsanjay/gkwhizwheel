import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
  ATTRACTIONS_DATA,
  AttractionPOI,
  AttractionCategory,
} from '../api/attractionsData';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Button } from '../components/Button';

interface CategoryTab {
  key: AttractionCategory;
  label: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'All Sights' },
  { key: 'beach_river', label: 'Beaches & Rivers' },
  { key: 'heritage', label: 'Heritage & Forts' },
  { key: 'nature_falls', label: 'Waterfalls & Caves' },
];

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<AttractionCategory>('all');

  const filteredAttractions = useMemo(() => {
    return ATTRACTIONS_DATA.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Search query filter
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchMap = item.mapLabel.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));

      return matchTitle || matchSub || matchDesc || matchMap || matchTags;
    });
  }, [searchQuery, activeCategory]);

  const handleOpenMap = (item: AttractionPOI) => {
    const { latitude, longitude } = item.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(item.title)}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(item.title)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        );
      });
    }
  };

  const handlePlanTrip = (item: AttractionPOI) => {
    // Deep-link into Tours service detail with pre-selected destination
    navigation.navigate('ServiceDetail', {
      serviceSlug: 'tours',
      preSelectedDestination: item.title,
    });
  };

  const renderItem = ({ item }: { item: AttractionPOI }) => {
    return (
      <View style={styles.card}>
        {/* Card Header & Badges */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.emojiWrap, { backgroundColor: `${item.color}15` }]}>
              <Text style={styles.emojiIcon}>{item.emoji}</Text>
            </View>
            <View style={styles.titleWrap}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        </View>

        {/* Distance & Proximity Pill */}
        <View style={styles.proximityRow}>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>📍 {item.distance}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>⏱️ {item.recommendedDuration}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsWrap}>
          {item.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.descriptionText}>{item.description}</Text>

        {/* Highlights Checklist */}
        <View style={styles.highlightsBox}>
          {item.highlights.map((highlight, idx) => (
            <View key={idx} style={styles.highlightRow}>
              <Text style={styles.highlightDot}>✓</Text>
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>

        {/* Map Coordinates & Directions Link */}
        <TouchableOpacity
          style={styles.mapLinkBox}
          onPress={() => handleOpenMap(item)}
          activeOpacity={0.75}
        >
          <View style={styles.mapInfo}>
            <Text style={styles.mapLabel}>🗺️ {item.mapLabel}</Text>
            <Text style={styles.coordinatesText}>
              {item.coordinates.latitude.toFixed(4)}° N,{' '}
              {item.coordinates.longitude.toFixed(4)}° E
            </Text>
          </View>
          <Text style={styles.openDirectionsText}>Open Map ↗</Text>
        </TouchableOpacity>

        {/* Action Buttons: Plan a trip here CTA (Deep-link to Tours) */}
        <View style={styles.actionsRow}>
          <Button
            title="Plan a Trip Here →"
            onPress={() => handlePlanTrip(item)}
            style={styles.planTripBtn}
          />
          <TouchableOpacity
            style={styles.bikeOptionBtn}
            onPress={() =>
              navigation.navigate('BikeBrowse', { search: item.title })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.bikeOptionText}>Rent Bike 🛵</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Honnavar • Gokarna • Murudeshwar</Text>
          <Text style={styles.headerTitle}>Explore Coastal Sights</Text>
          <Text style={styles.headerTagline}>
            Verified coastal attractions, secret beaches & heritage forts with station distances.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search attractions, beaches, waterfalls..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              accessible={true}
              accessibilityRole="search"
              accessibilityLabel="Search attractions, beaches, and waterfalls"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryWrap}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORY_TABS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.categoryList}
            accessibilityRole="tablist"
            renderItem={({ item }) => {
              const isActive = activeCategory === item.key;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    isActive && styles.categoryBtnActive,
                  ]}
                  onPress={() => setActiveCategory(item.key)}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={`Filter: ${item.label}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.categoryBtnText,
                      isActive && styles.categoryBtnTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Attractions List */}
        <FlatList
          data={filteredAttractions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🏖️</Text>
              <Text style={styles.emptyTitle}>No Attractions Found</Text>
              <Text style={styles.emptyText}>
                No destinations matched "{searchQuery}". Try selecting "All Sights" or searching by name.
              </Text>
              <Button
                title="Reset Filters"
                onPress={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                style={styles.resetBtn}
              />
            </View>
          }
        />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.secondary,
    marginTop: 2,
    marginBottom: 4,
  },
  headerTagline: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  clearSearchText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    padding: 4,
  },
  categoryWrap: {
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryList: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  categoryBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  categoryBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: colors.textInverted,
    fontWeight: typography.weights.bold,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emojiIcon: {
    fontSize: 24,
  },
  titleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.secondary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semibold,
    marginTop: 1,
  },
  proximityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  distanceBadge: {
    backgroundColor: colors.warningLight,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.warningDark,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
  },
  durationBadge: {
    backgroundColor: colors.background,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.background,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  descriptionText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  highlightsBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  highlightDot: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.accentDark,
    marginRight: 6,
    lineHeight: 16,
  },
  highlightText: {
    flex: 1,
    fontSize: 11,
    color: colors.text,
    lineHeight: 16,
  },
  mapLinkBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapInfo: {
    flex: 1,
  },
  mapLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  coordinatesText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },
  openDirectionsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginLeft: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTripBtn: {
    flex: 1.6,
    height: 42,
  },
  bikeOptionBtn: {
    flex: 1,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeOptionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  resetBtn: {
    minWidth: 160,
  },
});
