import { ViewStyle } from 'react-native';
import { colors } from './colors';

/**
 * GK WhizWheel Operations Mobile - Elevation & Shadows
 * Higher opacity and defined elevations so visual depth is maintained outdoors under direct sunlight.
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
} as const;

export type Shadows = typeof shadows;
export type ShadowTokens = typeof shadows;
