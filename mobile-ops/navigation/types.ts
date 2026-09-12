import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Dashboard: undefined;
  Services: undefined;
  Fleet: undefined;
  StationAdmin?: undefined; // Admin-only: strictly visible only to Store Manager / Super Admin
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  BookingDetail: { bookingId?: number; bookingCode?: string };
  HandoverFlow: { bookingId?: number; bookingCode?: string } | undefined;
  ReturnFlow: { bookingId?: number; bookingCode?: string } | undefined;
  BikeInspection: { bikeId: number };
  ServiceBookingDetail: { bookingId: number };
  RefundProcessing: { bookingId: number };
};
