# Database Schema — Full Field-Level Spec

This is the authoritative schema. Every migration, model, and API response should match this exactly — don't let an AI coding tool invent field names/types that differ from this doc across sessions.

**Engine:** MySQL 8 (InnoDB, utf8mb4_unicode_ci)
**Convention:** all tables use `id` (unsigned bigint, auto-increment) primary key, `created_at`/`updated_at` timestamps, and `deleted_at` (soft deletes) where noted.

---

## users
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| name | varchar(150) | not null |
| email | varchar(150) | unique, nullable (walk-ins may not have email) |
| phone | varchar(20) | unique, not null (primary identity key for lookup) |
| password | varchar(255) | nullable (walk-in-only customers never log in, so no password) |
| role | enum('customer','staff','store_manager','super_admin') | not null, default 'customer' |
| whatsapp_opt_in | boolean | default true |
| status | enum('active','blacklisted') | default 'active' |
| blacklist_reason | text | nullable |
| email_verified_at | timestamp | nullable |
| created_at, updated_at | timestamp | |
| deleted_at | timestamp | nullable (soft delete) |

Indexes: `phone` (unique), `email` (unique), `role`

## stores
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| name | varchar(150) | not null |
| address_line | varchar(255) | not null |
| city | varchar(100) | not null |
| state | varchar(100) | not null |
| pincode | varchar(10) | not null |
| latitude | decimal(10,7) | not null |
| longitude | decimal(10,7) | not null |
| phone | varchar(20) | nullable |
| operating_hours | json | nullable — e.g. `{"mon":"09:00-20:00", ...}` |
| status | enum('active','inactive') | default 'active' |
| created_at, updated_at | timestamp | |

## staff_store (pivot)
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | FK → users.id, not null |
| store_id | bigint unsigned | FK → stores.id, not null |
| created_at, updated_at | timestamp | |

Unique composite index: (`user_id`, `store_id`)

## bike_categories
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| name | varchar(100) | not null (e.g., "Scooter", "Cruiser", "Sports") |
| base_daily_rate | decimal(10,2) | not null |
| default_deposit_amount | decimal(10,2) | not null |
| created_at, updated_at | timestamp | |

## bikes
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| category_id | bigint unsigned | FK → bike_categories.id |
| current_store_id | bigint unsigned | FK → stores.id — where it physically sits right now |
| home_store_id | bigint unsigned | FK → stores.id — its nominal assigned store (for "bikes that have drifted" reporting) |
| brand | varchar(100) | not null |
| model_name | varchar(100) | not null |
| registration_number | varchar(30) | unique, not null |
| fuel_type | enum('petrol','electric') | not null |
| transmission | enum('manual','automatic') | not null |
| base_daily_rate_override | decimal(10,2) | nullable — overrides category default if set |
| deposit_amount_override | decimal(10,2) | nullable |
| odometer_reading | int unsigned | not null, default 0 |
| status | enum('available','on_rent','maintenance','retired') | default 'available' |
| next_service_due_date | date | nullable |
| primary_image_path | varchar(255) | nullable |
| created_at, updated_at | timestamp | |
| deleted_at | timestamp | nullable |

Indexes: `registration_number` (unique), `current_store_id`, `status`

## bike_images
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| bike_id | bigint unsigned | FK → bikes.id |
| file_path | varchar(255) | not null |
| sort_order | tinyint unsigned | default 0 |
| created_at | timestamp | |

## bike_documents
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| bike_id | bigint unsigned | FK → bikes.id, not null |
| document_type | enum('rc','insurance','emission_certificate') | not null |
| file_path | varchar(255) | not null |
| issue_date | date | nullable |
| expiry_date | date | nullable |
| uploaded_by | bigint unsigned | FK → users.id |
| verified | boolean | default false |
| created_at, updated_at | timestamp | |

Unique composite index: (`bike_id`, `document_type`) — one active doc per type per bike (keep history via a separate `bike_document_history` table if you want versioning later; not needed for v1)

## pricing_rules
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| bike_id | bigint unsigned | FK → bikes.id, nullable (null = applies to whole category) |
| category_id | bigint unsigned | FK → bike_categories.id, nullable |
| rule_type | enum('weekend','holiday','seasonal','one_way_fee') | not null |
| day_of_week | tinyint unsigned | nullable, 0=Sun..6=Sat (used for 'weekend' type) |
| date_start | date | nullable (used for 'holiday'/'seasonal') |
| date_end | date | nullable |
| from_store_id | bigint unsigned | FK → stores.id, nullable (used for 'one_way_fee') |
| to_store_id | bigint unsigned | FK → stores.id, nullable |
| rate_type | enum('percentage','fixed_override','flat_addon') | not null |
| value | decimal(10,2) | not null |
| priority | tinyint unsigned | default 0 — higher number wins if multiple rules overlap |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

## coupons
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| code | varchar(50) | unique, not null |
| discount_type | enum('percentage','fixed') | not null |
| value | decimal(10,2) | not null |
| max_uses_total | int unsigned | nullable |
| max_uses_per_user | int unsigned | default 1 |
| valid_from | date | not null |
| valid_until | date | not null |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

## coupon_usages
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| coupon_id | bigint unsigned | FK → coupons.id |
| user_id | bigint unsigned | FK → users.id |
| booking_id | bigint unsigned | FK → bookings.id |
| created_at | timestamp | |

## bookings
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| booking_reference | varchar(20) | unique, not null (human-readable, e.g. BK-2026-00123) |
| bike_id | bigint unsigned | FK → bikes.id, not null |
| user_id | bigint unsigned | FK → users.id, not null |
| pickup_store_id | bigint unsigned | FK → stores.id, not null |
| return_store_id | bigint unsigned | FK → stores.id, not null |
| channel | enum('online','offline') | not null |
| status | enum('held','pending_payment','confirmed','handed_over','returned','completed','cancelled','expired','no_show') | not null, default 'held' |
| start_date | date | not null |
| end_date | date | not null |
| base_amount | decimal(10,2) | not null |
| pricing_adjustments_amount | decimal(10,2) | default 0 (sum of weekend/holiday/seasonal adjustments) |
| one_way_fee_amount | decimal(10,2) | default 0 |
| addon_amount | decimal(10,2) | default 0 |
| discount_amount | decimal(10,2) | default 0 |
| deposit_amount | decimal(10,2) | not null |
| late_fee_amount | decimal(10,2) | default 0 |
| damage_fee_amount | decimal(10,2) | default 0 |
| total_amount | decimal(10,2) | not null |
| price_breakdown_json | json | not null — full itemized snapshot at time of booking |
| held_until | timestamp | nullable (used only while status = 'held') |
| created_by | bigint unsigned | FK → users.id, nullable — staff who created it (null = customer self-service online) |
| completed_by | bigint unsigned | FK → users.id, nullable — staff who processed the return |
| agreement_signed_at | timestamp | nullable |
| agreement_signature_path | varchar(255) | nullable |
| idempotency_key | varchar(100) | unique, not null |
| created_at, updated_at | timestamp | |

Indexes: `booking_reference` (unique), `idempotency_key` (unique), (`bike_id`, `start_date`, `end_date`, `status`) composite for availability checks, `user_id`, `pickup_store_id`, `return_store_id`

## booking_addons
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| booking_id | bigint unsigned | FK → bookings.id |
| addon_type | enum('helmet','extra_rider','insurance','gps') | not null |
| quantity | tinyint unsigned | default 1 |
| unit_price | decimal(10,2) | not null |
| created_at | timestamp | |

## payments
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| booking_id | bigint unsigned | FK → bookings.id, not null |
| type | enum('advance','deposit','late_fee','damage_fee','refund') | not null |
| amount | decimal(10,2) | not null |
| method | enum('razorpay','phonepe','cash','card_pos') | not null |
| gateway_reference | varchar(150) | nullable — null for cash |
| status | enum('pending','success','failed','refunded') | not null, default 'pending' |
| collected_by | bigint unsigned | FK → users.id, nullable — staff who collected cash/card in-store |
| notes | text | nullable |
| created_at, updated_at | timestamp | |

## refunds
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| booking_id | bigint unsigned | FK → bookings.id |
| payment_id | bigint unsigned | FK → payments.id, nullable |
| amount | decimal(10,2) | not null |
| reason | text | not null |
| processed_by | bigint unsigned | FK → users.id |
| gateway_reference | varchar(150) | nullable |
| status | enum('pending','completed','failed') | default 'pending' |
| created_at, updated_at | timestamp | |

## kyc_documents
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | FK → users.id, not null |
| document_type | enum('driving_license','national_id','passport') | not null |
| file_path | varchar(255) | not null |
| verified | boolean | default false |
| verified_by | bigint unsigned | FK → users.id, nullable |
| verified_at | timestamp | nullable |
| created_at, updated_at | timestamp | |

## bike_condition_logs
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| booking_id | bigint unsigned | FK → bookings.id, not null |
| stage | enum('handover','return') | not null |
| odometer_reading | int unsigned | not null |
| notes | text | nullable |
| logged_by | bigint unsigned | FK → users.id |
| created_at | timestamp | |

## bike_condition_photos
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| bike_condition_log_id | bigint unsigned | FK → bike_condition_logs.id |
| file_path | varchar(255) | not null |
| created_at | timestamp | |

## reviews
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| booking_id | bigint unsigned | FK → bookings.id, unique |
| user_id | bigint unsigned | FK → users.id |
| bike_id | bigint unsigned | FK → bikes.id |
| rating | tinyint unsigned | not null, 1–5 |
| comment | text | nullable |
| is_visible | boolean | default true (admin moderation) |
| created_at, updated_at | timestamp | |

## activity_logs
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | FK → users.id — who performed the action |
| store_id | bigint unsigned | FK → stores.id, nullable — where the action happened |
| action | varchar(100) | not null (e.g., "booking.cancelled", "pricing_rule.updated") |
| subject_type | varchar(100) | polymorphic — e.g. "Booking", "Bike" |
| subject_id | bigint unsigned | polymorphic |
| old_values | json | nullable |
| new_values | json | nullable |
| created_at | timestamp | |

## notification_logs
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| user_id | bigint unsigned | FK → users.id |
| booking_id | bigint unsigned | FK → bookings.id, nullable |
| channel | enum('email','whatsapp') | not null |
| template | varchar(100) | not null |
| status | enum('sent','delivered','failed') | not null |
| error_message | text | nullable |
| sent_at | timestamp | |

## sync_queue (mobile app offline support)
| Field | Type | Constraints |
|---|---|---|
| id | bigint unsigned | PK |
| device_id | varchar(150) | not null |
| user_id | bigint unsigned | FK → users.id |
| action_type | varchar(100) | not null (e.g. "create_booking", "mark_returned") |
| payload_json | json | not null |
| idempotency_key | varchar(100) | unique, not null |
| status | enum('pending','synced','failed') | default 'pending' |
| synced_at | timestamp | nullable |
| created_at | timestamp | |

---

## Relationship Summary (for ORM setup)
- `User` hasMany `Booking` (as customer), hasMany `Booking` (as created_by/completed_by staff), belongsToMany `Store` (through staff_store)
- `Store` hasMany `Bike` (current + home), hasMany `Booking` (as pickup/return)
- `Bike` belongsTo `BikeCategory`, hasMany `BikeDocument`, hasMany `BikeImage`, hasMany `PricingRule`, hasMany `Booking`
- `Booking` belongsTo `Bike`, `User`, two `Store` relations (pickup/return), hasMany `Payment`, hasMany `BookingAddon`, hasOne `Review`, hasMany `BikeConditionLog`

## Notes for Migration Order (foreign key dependencies)
1. `users`, `stores`, `bike_categories` (no dependencies)
2. `staff_store`, `bikes` (depend on users/stores/categories)
3. `bike_images`, `bike_documents`, `pricing_rules`, `coupons` (depend on bikes/categories)
4. `bookings` (depends on bikes, users, stores)
5. Everything else (payments, refunds, reviews, logs) depends on bookings
