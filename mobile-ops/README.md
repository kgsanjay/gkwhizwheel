# GK WhizWheel Operations Mobile App (`gkwhizwheel-ops`)

Native React Native Expo application for GK WhizWheel ground crew, station hub managers, and fleet maintenance administrators.

## Features
- **Secure Staff Authentication**: Dedicated staff and store manager role validation via Laravel Sanctum.
- **Station Hub Scoping**: Station-specific queue of today's pickups, dispatches, and pending returns.
- **Instant Booking Lookup**: Search booking codes (`GKW-XXXX`) or scan customer QR vouchers.
- **Vehicle Inspection & Fleet Management**: Live fuel level, odometer telemetry, and maintenance flag toggling.
- **Accessible Native Design System**: Designed for high-contrast visibility in bright outdoor coastal Karnataka conditions with >=48dp touch targets.

## Architecture
- `screens/`: Screens for Auth (Login), Dashboard, Fleet, and Profile.
- `components/`: Button, Input, Header, Badge, and Card with WCAG 2.2 AA compliance.
- `navigation/`: React Navigation v7 with Native Stack & Bottom Tabs.
- `api/`: Axios client with Sanctum token management and offline-aware token caching.
- `theme/`: Color palette, typography, spacing, border-radius, and elevation tokens.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run Jest tests
npm test
```

## Internal Distribution

Because the Operations App contains sensitive capabilities and is exclusively for staff use, it **must not** be published to the Google Play Store or Apple App Store.

We distribute this app internally using Expo Application Services (EAS).

### Building the App

To generate an internal build (APK for Android, Ad-Hoc for iOS):

```bash
# Login to EAS (if not already logged in)
npx eas login

# Build for Android (APK)
npx eas build --profile preview --platform android

# Build for iOS (requires Apple Developer Account with staff device UIDs registered)
npx eas build --profile preview --platform ios
```

### Distributing to Staff Devices

1. **EAS Dashboard Link:** Once the build completes, the CLI will output a URL (e.g., `https://expo.dev/artifacts/eas/xxx.apk`). You can share this link directly in the staff WhatsApp/Slack group.
2. **Install via QR Code:** The Expo Dashboard provides a QR code for every successful build. Store managers can scan this QR code directly from the manager's laptop using their Android devices to immediately download and install the APK.
3. **Android Warning:** Since the app is sideloaded, staff will need to enable "Install from Unknown Sources" on their Android devices when prompted.
4. **iOS Devices:** iOS requires the device UDID to be registered in the Apple Developer portal. Use `npx eas device:create` to register new staff iPhones before running the iOS build.
