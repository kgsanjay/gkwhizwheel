import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation/types';
import { storage } from '../api/storage';
import { notificationService } from '../services/notificationService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Button } from '../components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IntroSlide {
  id: string;
  emoji: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
}

const INTRO_SLIDES: IntroSlide[] = [
  {
    id: 'slide-1',
    emoji: '🛵',
    tag: 'Instant Station Pickup',
    title: 'Seamless Two-Wheeler Rentals',
    subtitle: 'Honnavar Railway Hub (Platform 1)',
    description:
      'Step off the train and onto your ride in under 3 minutes. Zero wait times, certified commercial yellow-board bikes, and complete freedom to discover coastal Karnataka.',
  },
  {
    id: 'slide-2',
    emoji: '🌊',
    tag: 'All-in-One Coastal Gateway',
    title: 'Tourism & Multi-Service Hub',
    subtitle: 'Bikes, Cabs, Boating & Homestays',
    description:
      'Beyond two-wheelers: book verified local cabs, Sharavathi backwater boating, Netrani scuba diving, and authentic beach homestays with transparent pricing in one unified app.',
  },
  {
    id: 'slide-3',
    emoji: '🛡️',
    tag: 'Transparent & Safe',
    title: 'Ride with Total Peace of Mind',
    subtitle: 'Clear Pricing & 24/7 Roadside SOS',
    description:
      'Zero hidden charges. Transparent refundable security deposit, two complimentary ISI-certified helmets with every ride, and 24/7 coastal emergency rescue hotline.',
  },
];

type OnboardingStage = 'slides' | 'location_primer' | 'notification_primer';

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollRef = useRef<ScrollView>(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [stage, setStage] = useState<OnboardingStage>('slides');
  const [requestingLocation, setRequestingLocation] = useState<boolean>(false);
  const [requestingNotification, setRequestingNotification] = useState<boolean>(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveSlideIndex(index);
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < INTRO_SLIDES.length - 1) {
      const nextIndex = activeSlideIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setActiveSlideIndex(nextIndex);
    } else {
      // Transition to Location Permission Primer
      setStage('location_primer');
    }
  };

  const handleSkipIntro = () => {
    setStage('location_primer');
  };

  // Location Permission Primer Handling
  const handleEnableLocation = async () => {
    setRequestingLocation(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // Ignore error and continue
    } finally {
      setRequestingLocation(false);
      setStage('notification_primer');
    }
  };

  const handleSkipLocation = () => {
    setStage('notification_primer');
  };

  // Notification Permission Primer Handling
  const handleEnableNotification = async () => {
    setRequestingNotification(true);
    try {
      await notificationService.registerForPushNotificationsAsync();
    } catch {
      // Ignore error and complete onboarding
    } finally {
      setRequestingNotification(false);
      await finishOnboarding();
    }
  };

  const handleSkipNotification = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    await storage.setOnboardingCompleted(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  // Render Permission Primers
  if (stage === 'location_primer') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.primerContainer}>
          <View style={styles.primerCard}>
            <View style={styles.primerIconWrap}>
              <Text style={styles.primerEmoji}>📍</Text>
            </View>

            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>Station Hub Proximity</Text>
            </View>

            <Text style={styles.primerTitle}>Find Your Nearest Station Hub</Text>
            <Text style={styles.primerSubtitle}>
              Honnavar, Murdeshwar & Gokarna Stations
            </Text>

            <View style={styles.explanationBox}>
              <Text style={styles.explanationHeader}>Why we need your location:</Text>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Automatically identifies your closest GK WhizWheels pickup station.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Calculates accurate arrival estimates and turn-by-turn station directions.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  Shows live bike availability at your selected station platform.
                </Text>
              </View>
            </View>

            <Text style={styles.privacyNote}>
              🔒 Your location is only used while actively browsing hubs and is never shared with third parties.
            </Text>
          </View>

          <View style={styles.primerActionButtons}>
            <Button
              title={requestingLocation ? 'Requesting...' : 'Enable Location Services'}
              onPress={handleEnableLocation}
              loading={requestingLocation}
              accessibilityLabel="Enable Location Services"
              accessibilityHint="Requests device location to identify nearby pickup stations"
              style={styles.primaryActionBtn}
            />
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleSkipLocation}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Maybe Later"
              accessibilityHint="Skips location setup for now"
            >
              <Text style={styles.secondaryActionText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'notification_primer') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.primerContainer}>
          <View style={styles.primerCard}>
            <View style={styles.primerIconWrap}>
              <Text style={styles.primerEmoji}>🔔</Text>
            </View>

            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>Live Ride Milestones</Text>
            </View>

            <Text style={styles.primerTitle}>Never Miss a Ride Milestone</Text>
            <Text style={styles.primerSubtitle}>
              Pickup Reminders & Road Safety Alerts
            </Text>

            <View style={styles.explanationBox}>
              <Text style={styles.explanationHeader}>What you will receive:</Text>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Pickup Reminder:</Text> Sent 2 hours before your ride with store directions.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Instant Confirmation:</Text> QR voucher & booking invoice for fast 3-min handover.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Return Alert:</Text> Timely return reminder to avoid automatic late charges.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletBold}>Emergency Road SOS:</Text> Coastal monsoon weather & highway advisories.
                </Text>
              </View>
            </View>

            <Text style={styles.privacyNote}>
              🔒 Zero spam guarantee. You can customize notification preferences anytime in your Profile.
            </Text>
          </View>

          <View style={styles.primerActionButtons}>
            <Button
              title={requestingNotification ? 'Requesting...' : 'Enable Ride Notifications'}
              onPress={handleEnableNotification}
              loading={requestingNotification}
              accessibilityLabel="Enable Ride Notifications"
              accessibilityHint="Requests notification permissions to send pickup alerts and countdowns"
              style={styles.primaryActionBtn}
            />
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleSkipNotification}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Skip for Now"
              accessibilityHint="Skips notifications setup for now"
            >
              <Text style={styles.secondaryActionText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render Swipeable Intro Slides
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header with Skip action */}
      <View style={styles.topBar}>
        <View style={styles.brandTitleWrap}>
          <Text style={styles.brandTitle}>GK WHIZWHEEL</Text>
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipIntro}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Skip introductory slides"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Swipeable Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {INTRO_SLIDES.map((slide) => (
          <View
            key={slide.id}
            style={[styles.slide, { width: SCREEN_WIDTH }]}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${slide.title}. ${slide.subtitle}. ${slide.description}`}
          >
            <View style={styles.slideCard}>
              <View style={styles.slideEmojiWrap}>
                <Text style={styles.slideEmoji}>{slide.emoji}</Text>
              </View>

              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{slide.tag}</Text>
              </View>

              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation & Indicator Dots */}
      <View style={styles.bottomBar}>
        <View style={styles.dotsRow} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
          {INTRO_SLIDES.map((slide, idx) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                activeSlideIndex === idx && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <Button
          title={
            activeSlideIndex === INTRO_SLIDES.length - 1
              ? 'Get Started'
              : 'Continue'
          }
          onPress={handleNextSlide}
          accessibilityLabel={
            activeSlideIndex === INTRO_SLIDES.length - 1
              ? 'Get Started with GK WhizWheel'
              : 'Continue to next slide'
          }
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
    letterSpacing: 1.5,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  slideEmojiWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  slideEmoji: {
    fontSize: 44,
  },
  tagBadge: {
    backgroundColor: colors.background,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  slideSubtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  nextButton: {
    width: '100%',
  },

  // Permission Primers
  primerContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  primerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
    marginTop: spacing.md,
  },
  primerIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  primerEmoji: {
    fontSize: 38,
  },
  primerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  primerSubtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  explanationBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: typography.sizes.sm,
    color: colors.primaryDark,
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  bulletBold: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  privacyNote: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },
  primerActionButtons: {
    paddingTop: spacing.md,
  },
  primaryActionBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  secondaryActionBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});
