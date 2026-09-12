export type UserRole = 'super_admin' | 'store_manager' | 'staff' | 'customer';

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  store_id?: number;
  store_name?: string;
  stores?: Store[];
  assigned_stores?: Array<{
    id: number;
    name: string;
    code: string;
    is_primary?: boolean;
  }>;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  city: string;
  address?: string;
  address_line?: string;
  phone?: string;
  is_active?: boolean;
}

export interface KYCVerification {
  id: number;
  user_id: number;
  customer?: Customer;
  id_document_type?: string;
  id_document_number?: string;
  id_document_url?: string;
  id_document_front_url?: string;
  id_document_back_url?: string;
  driving_license_number?: string;
  driving_license_url?: string;
  driving_license_front_url?: string;
  driving_license_back_url?: string;
  selfie_url?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  verified_at?: string;
  created_at?: string;
}

export interface AdminRevenueReport {
  start_date: string;
  end_date: string;
  group_by: string;
  total_revenue: number;
  total_bookings: number;
  items: Array<{
    group_key: string | number;
    label: string;
    city?: string;
    registration_number?: string;
    booking_count: number;
    total_revenue: number;
    rental_revenue: number;
    deposit_revenue: number;
  }>;
}

export interface AdminUtilizationReport {
  start_date: string;
  end_date: string;
  total_days: number;
  total_bikes: number;
  overall_utilization_percentage: number;
  bikes: Array<{
    id: number;
    brand: string;
    model_name: string;
    registration_number: string;
    current_store: string;
    status: string;
    booked_days: number;
    total_days: number;
    utilization_percentage: number;
  }>;
}

export interface Bike {
  id: number;
  name?: string;
  model_name?: string;
  brand?: string;
  registration_number: string;
  category_id?: number;
  category_name?: string;
  category?: { id?: number; name: string; base_daily_rate?: number };
  current_store_id: number;
  current_store_name?: string;
  status: 'available' | 'booked' | 'maintenance' | 'inactive';
  fuel_level?: number; // percentage 0 - 100
  odometer_reading?: number; // km
  daily_rate?: number;
  deposit_amount?: number;
  image_url?: string;
  images?: Array<{ id?: number; image_path: string }>;
  last_serviced_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  kyc_status?: 'pending' | 'verified' | 'rejected' | 'not_submitted';
  driving_license_number?: string;
}

export interface OpsRefund {
  id: number;
  booking_id: number;
  payment_id?: number;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed' | string;
  gateway_reference?: string;
  processed_by?: number;
  processor?: {
    id: number;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface OpsBooking {
  id: number;
  booking_code?: string;
  booking_reference?: string;
  user_id: number;
  customer?: Customer;
  user?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  bike_id: number;
  bike?: Bike;
  pickup_store_id: number;
  pickup_store_name?: string;
  pickup_store?: Store;
  return_store_id: number;
  return_store_name?: string;
  return_store?: Store;
  start_date: string;
  end_date: string;
  status: 'confirmed' | 'handed_over' | 'active' | 'completed' | 'returned' | 'cancelled' | string;
  total_amount: number;
  paid_amount?: number;
  deposit_amount?: number;
  outstanding_balance?: number;
  security_deposit?: number;
  helmets_provided?: number;
  odometer_start?: number;
  odometer_end?: number;
  fuel_start?: number;
  fuel_end?: number;
  handover_photos?: string[];
  handover_notes?: string;
  return_notes?: string;
  scheduled_time?: string;
  is_overdue?: boolean;
  refunds?: OpsRefund[];
}

export interface StoreFleetSummary {
  storeId: number;
  storeName: string;
  availableCount: number;
  bookedCount: number;
  maintenanceCount: number;
  totalCount: number;
}

export interface OpsDashboardStats {
  todayPickupsCount: number;
  todayReturnsCount: number;
  activeRentalsCount: number;
  availableBikesCount: number;
  maintenanceBikesCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface OpsServiceBooking {
  id: number;
  booking_number: string;
  service_type: string;
  service_item_id?: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_channel: string;
  start_datetime: string;
  end_datetime?: string;
  pickup_location?: string;
  drop_location?: string;
  quantity: number;
  base_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  customer_notes?: string;
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}
