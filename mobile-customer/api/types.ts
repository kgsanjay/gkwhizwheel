export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]> | {
    code?: string;
    retry_after?: number;
    client_version?: string;
    min_supported_version?: string;
    is_deprecated_client?: boolean;
    [key: string]: any;
  };
}

export interface Bike {
  id: number;
  category_id: number;
  current_store_id: number;
  home_store_id: number;
  brand: string;
  model_name: string;
  registration_number: string;
  fuel_type: 'petrol' | 'electric';
  transmission: 'manual' | 'automatic';
  status: 'available' | 'booked' | 'maintenance' | 'in_service';
  daily_rate?: number;
  images?: Array<{ id: number; image_path: string }>;
  category?: {
    id: number;
    name: string;
    base_daily_rate: number;
  };
  store?: {
    id: number;
    name: string;
    city: string;
  };
}

export interface BikeCategory {
  id: number;
  name: string;
  base_daily_rate: number;
  default_deposit_amount?: number;
  description?: string;
  icon?: string;
}

export interface ServiceItem {
  id: number;
  service_type: string;
  name: string;
  category?: string;
  description?: string;
  price_base: number;
  price_unit: string;
  capacity?: number;
  image_url?: string;
  primary_image_url?: string;
  badge?: string;
  features?: string[];
  status: 'available' | 'active' | 'inactive';
  sort_order?: number;
  images?: Array<{ id: number; image_path: string }>;
}

export interface Store {
  id: number;
  name: string;
  city: string;
  address_line: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export interface Booking {
  id: number;
  booking_number: string;
  customer_id: number;
  bike_id: number;
  pickup_store_id: number;
  return_store_id: number;
  start_date: string;
  end_date: string;
  total_amount: number;
  deposit_amount: number;
  status: 'held' | 'confirmed' | 'active' | 'handed_over' | 'returned' | 'cancelled';
  bike?: Bike;
  pickup_store?: Store;
  return_store?: Store;
  created_at: string;
}

export interface BookingAddon {
  addon_type: 'helmet' | 'extra_rider' | 'insurance' | 'gps';
  quantity: number;
  unit_price: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'store_manager' | 'super_admin';
  kyc_status?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  whatsapp_opt_in?: boolean;
  avatar?: string;
}

export interface KycDocument {
  id: number;
  user_id: number;
  document_type: 'driving_license' | 'national_id' | 'passport';
  file_path: string;
  verified: boolean;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'upi' | 'card';
  title: string;
  subtitle: string;
  icon: string;
  isDefault?: boolean;
}

export interface RazorpayCheckoutData {
  booking_id: number;
  booking_reference: string;
  gateway: 'razorpay';
  order_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  key_id: string;
  status: string;
  notes?: Record<string, any>;
}

export interface PhonePeCheckoutData {
  booking_id: number;
  booking_reference: string;
  gateway: 'phonepe';
  merchant_transaction_id: string;
  redirect_url: string;
  amount: number;
  amount_paise: number;
  currency: string;
  status: string;
}

export interface PaymentVerificationResponse {
  booking_id: number;
  status: string;
  payment_verified: boolean;
  message: string;
}
