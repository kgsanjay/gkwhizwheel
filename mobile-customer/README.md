# GK WhizWheel — Customer Mobile App (React Native / Expo)

Welcome to the **GK WhizWheel Mobile Customer App**, built with React Native and Expo SDK 52. This application powers self-drive two-wheeler bike rentals, station hub pickups, and coastal Karnataka sightseeing experiences (Honnavar, Gokarna, Murudeshwar, Jog Falls).

---

## 1. Local Development Setup

### 1.1 Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **yarn**
- **Expo Go** app installed on your physical Android / iOS phone, or Android Studio / Xcode emulators
- **PHP 8.2+ & Composer** (for running the backend Laravel API)

### 1.2 Running the Backend Laravel API
In the root directory of the repository:

```bash
# 1. Start MySQL and check .env database connection
# 2. Serve Laravel API binding to all network interfaces (0.0.0.0) so mobile devices on LAN can connect:
php artisan serve --host=0.0.0.0 --port=8000
```

> **Important**: Do NOT run `php artisan serve` with default `127.0.0.1` if you are testing on a physical mobile device or Android Emulator. `0.0.0.0` ensures the server accepts incoming requests from your local network.

### 1.3 Configuring the Mobile API URL
Create or update `mobile-customer/.env`:

```bash
cd mobile-customer
cp .env.example .env  # Or create .env directly
```

Choose the appropriate `EXPO_PUBLIC_API_URL` based on your testing environment:

| Target Device | `EXPO_PUBLIC_API_URL` | Explanation |
|---|---|---|
| **Android Emulator** | `http://10.0.2.2:8000/api/v1` | `10.0.2.2` is Android emulator's special alias to host loopback interface |
| **iOS Simulator** | `http://localhost:8000/api/v1` | iOS simulator shares macOS host networking stack directly |
| **Physical Phone (LAN)** | `http://192.168.1.X:8000/api/v1` | Replace with your computer's local Wi-Fi IPv4 address (`ipconfig getifaddr en0`) |
| **Cloud Dev / Tunnel** | `https://your-ngrok-subdomain.ngrok-free.app/api/v1` | Useful when testing outside same Wi-Fi or with webhooks |

### 1.4 Starting the Expo Development Server
```bash
cd mobile-customer

# Install dependencies (if not already installed)
npm install

# Start Expo with cleared cache
npx expo start -c
```

- Press **`a`** to open on Android Emulator.
- Press **`i`** to open on iOS Simulator.
- Scan the QR code using the **Expo Go** app on your physical device (ensure phone and computer are on the same Wi-Fi).

---

## 2. Environment Configurations (Staging & Production)

Environment URLs are driven by `process.env.EXPO_PUBLIC_API_URL` and `eas.json` build profiles:

### 2.1 Staging Environment
```env
EXPO_PUBLIC_API_URL=https://staging-api.gkwhizwheel.com/api/v1
EXPO_PUBLIC_SENTRY_DSN=https://public@sentry.io/gkwhizwheel-staging
NODE_ENV=staging
```

### 2.2 Production Environment
```env
EXPO_PUBLIC_API_URL=https://gkwhizwheel.com/api/v1
EXPO_PUBLIC_SENTRY_DSN=https://public@sentry.io/gkwhizwheel-customer
NODE_ENV=production
```

---

## 3. EAS Build & Release Configuration

The repository includes a pre-configured [`eas.json`](./eas.json) ready for Expo Application Services (EAS):

### 3.1 Install & Authenticate EAS CLI
```bash
npm install -g eas-cli
eas login
eas project:init
```

### 3.2 Build Profiles

| Profile | Output Type | Target Use Case | Command |
|---|---|---|---|
| **`development`** | Dev Client APK / iOS Simulator | Custom native modules & interactive debugging | `eas build -p android --profile development` |
| **`preview`** | Standalone Installable `.apk` | Internal QA, staging validation, client test devices | `eas build -p android --profile preview` |
| **`production`** | Optimized `.aab` (Android) / `.ipa` (iOS) | Google Play Store release & Apple TestFlight / App Store | `eas build -p all --profile production` |

### 3.3 Generating Distributable Android APK (Internal QA)
To generate a standalone APK that can be installed on any Android device without Expo Go:
```bash
eas build --platform android --profile preview
```
Once the build completes on EAS cloud, scan the terminal QR code or download the `.apk` file directly.

### 3.4 Generating Production Store Bundles
```bash
# Android App Bundle (.aab) for Google Play Console:
eas build --platform android --profile production

# iOS App Store Package (.ipa) for App Store Connect:
eas build --platform ios --profile production
```

### 3.5 Automated Store Submissions
```bash
# Submit to Google Play Track:
eas submit -p android --profile production

# Submit to Apple App Store Connect:
eas submit -p ios --profile production
```

---

## 4. App Store & Google Play Listing Assets Checklist

When submitting **GK WhizWheel** to Apple App Store and Google Play Store, prepare the following metadata:

### 4.1 App Listing Copy

- **App Name**: `GK WhizWheel` (Google Play: 30 chars; Apple: 30 chars)
- **Subtitle** (iOS, max 30 chars): `Self-Drive Bikes & Honnavar Stays`
- **Short Description** (Google Play, max 80 chars):
  `Rent self-drive bikes & scooters in Honnavar, Gokarna & coastal Karnataka.`
- **Category**: `Travel & Local` / `Navigation & Transportation`
- **Content Rating**: `Everyone` (PEGI 3 / USK 0 / IARC)

#### Full Description (Markdown Copy)
```text
Experience coastal Karnataka like never before with GK WhizWheel — your premier self-drive two-wheeler rental and local travel companion.

Whether you're hopping off the train at Honnavar Railway Station (Platform 1 Exit), planning a beach excursion to Gokarna and Murudeshwar, or seeking a waterfall escape to Jog Falls and Apsarakonda, GK WhizWheel puts the keys in your hands within minutes.

TOP FEATURES:
• Instant Bike & Scooter Rentals: Choose from Honda Activa, Yamaha Aerox, Royal Enfield Classic 350, Himalayan, and KTM Duke.
• Commercial Yellow-Plate Compliant: 100% government-authorized commercial self-drive registration with comprehensive insurance.
• Free Inclusions: 2 complimentary sanitized ISI helmets with every vehicle.
• Station Hub Pickup & Returns: Direct walk-in counter at Honnavar Railway Station Exit Gate.
• Flexible Payments: Reserve ahead with UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, or Pay Cash at Station Platform.
• 24/7 Roadside Assistance: On-demand mechanical support and battery swap support across the coastal route.
• Beyond Bikes: Book certified local tour guides, Sharavathi river boat cruises, Netrani Island scuba expeditions, and scenic riverside homestays.

Download GK WhizWheel today and ride the coast with absolute freedom!
```

- **Keywords (iOS, 100 chars)**:
  `bike rental,scooter hire,honnavar,gokarna,murudeshwar,self-drive,two wheeler,karnataka tourism,activa`

---

### 4.2 Visual Assets Checklist

All brand assets have been generated in [`mobile-customer/assets/`](./assets):

| Asset Name | Dimensions | Specs & Format | Location | Status |
|---|---|---|---|---|
| **App Store Icon** | `1024 x 1024 px` | PNG, 24-bit RGB, **no alpha/transparency**, flat corner radius | `assets/icon.png` | ✅ Generated |
| **Adaptive Foreground** | `1024 x 1024 px` | PNG with transparent background | `assets/adaptive-icon.png` | ✅ Generated |
| **Splash Screen** | `1284 x 2778 px` | PNG, centered brand emblem, background `#0F172A` | `assets/splash.png` | ✅ Generated |
| **Favicon** | `48 x 48 px` | PNG | `assets/favicon.png` | ✅ Generated |
| **Google Play Feature Graphic** | `1024 x 500 px` | PNG or JPEG, 24-bit RGB, no transparency | `assets/feature-graphic.png` | ✅ Generated |
| **Notification Icon** | `96 x 96 px` | Monochrome white silhouette on transparent background | `assets/notification-icon.png` | ✅ Generated |

#### Screenshot Requirements for Store Review
| Platform | Display Size | Target Resolutions | Required Screens |
|---|---|---|---|
| **iOS (iPhone 16 Pro Max / 15 Plus)** | 6.7" / 6.9" | `1290 x 2796 px` | 1. Hero Fleet & Category Carousel<br>2. Filterable Bike Browse Sheet<br>3. 360° Bike Details & Inclusions<br>4. Multi-step Dates & Hub Checkout<br>5. Live Reservation Confirmation |
| **iOS (iPhone 8 Plus)** | 5.5" | `1242 x 2208 px` | Same sequence formatted for 16:9 |
| **iOS (iPad Pro 13")** | 13" Tablet | `2048 x 2732 px` | Same sequence in tablet split layout |
| **Android (Phone)** | 16:9 / 18:9 / 20:9 | `1080 x 2400 px` | Minimum 4 screenshots (Max 8) |
| **Android (7" & 10" Tablet)** | 16:10 / 4:3 | `1200 x 1920 px` | Minimum 1 screenshot per form factor |

---

### 4.3 Mandatory URLs & Legal Compliance

- **Privacy Policy URL**:
  `https://gkwhizwheel.com/privacy`
  *(Live web route serving complete KYC collection, location telemetry, data retention, and Grievance Officer details)*
- **Terms & Rental Policies URL**:
  `https://gkwhizwheel.com/terms`
- **Support & Grievance Contact**:
  - Email: `support@gkwhizwheel.com` / `privacy@gkwhizwheel.com`
  - Helpline: `+91 94801 23456`
  - Address: Exit Platform 1, Railway Station Road, Honnavar, Karnataka 581334

#### Account Deletion Mechanism (Apple Guideline 5.1.1(v) & Google Play)
1. **In-App**: Customers can tap **Profile > Account Security > Request Account Deletion**.
2. **Web URL / Direct Request**: Customers can visit `https://gkwhizwheel.com/privacy` or email `privacy@gkwhizwheel.com` with their registered mobile number. Accounts and KYC files are permanently purged within 14 days.

---

### 4.4 App Review Credentials (Demo Account for Apple & Google Testers)

For store reviewers testing the application:

- **Demo User Email**: `appreview@gkwhizwheel.com`
- **Demo User Password**: `WhizWheel@Test2026!`
- **Demo Phone Number**: `+91 98888 77777`
- **Test OTP (if requested)**: `123456`
- **Notes for Reviewers**:
  ```text
  The app allows travelers to rent self-drive bikes in coastal Karnataka (Honnavar).
  Reviewers can select any available bike (e.g. Honda Activa 6G or Royal Enfield Classic 350),
  proceed through date selection and hub pickup, and use "Pay at Station Hub" or test card
  details to test checkout without incurring real monetary charges.
  ```

---

## 5. Verification Commands

Run test and build validation commands locally before submitting:

```bash
# 1. Run all unit & integration test suites:
npm test

# 2. Type-check TypeScript codebase:
npx tsc --noEmit

# 3. Test Metro Android production bundle export:
npx expo export -p android
```
