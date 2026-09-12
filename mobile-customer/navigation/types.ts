import { NavigatorScreenParams } from '@react-navigation/native';
import { Bike, Booking } from '../api/types';

export type MainTabParamList = {
  Home: undefined;
  Explore: { destinationTitle?: string } | undefined;
  Services: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Services: undefined;
  ServiceDetail: { serviceId?: string; serviceSlug?: string; preSelectedDestination?: string };
  BikeBrowse: { categoryId?: number; storeId?: number; search?: string } | undefined;
  BikeDetail: { bikeId: number; bike?: Bike };
  Checkout: { bikeId: number; bike?: Bike };
  BookingDetail: { bookingId: number; booking?: Booking };
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  Onboarding: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
