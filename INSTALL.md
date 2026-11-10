# GK WhizWheels Mobile Apps

This document contains download links and testing instructions for the GK WhizWheels mobile applications.

## Download Links (Internal Preview)

These are direct APK download links generated from Expo EAS (internal distribution profiles). 

- **Customer App (`mobile-customer`)**: [Download APK](https://expo.dev/accounts/kgsanjay/projects/gkwhizwheel-customer/builds/bdc05efd-e137-4d76-96eb-3b6a9c4cf8e5)
- **Operations App (`mobile-ops`)**: [Download APK](https://expo.dev/accounts/kgsanjay/projects/gkwhizwheel-ops/builds/42304658-263f-4438-949d-d6b0009b5f8c)

---

## App Descriptions

- **Customer App**: The user-facing application used by end customers to browse available bikes, book rentals, complete KYC, and manage their trips.
- **Operations App**: The internal staff application used by store managers and staff to manage inventory, verify customer KYC, dispatch bikes, and handle returns/maintenance.

---

## How to Install (Android Sideloading)

Since these APKs are not currently distributed through the Google Play Store, you will need to enable sideloading to install them on your Android device.

1. **Download the APK**: Tap the direct download link above from your Android device.
2. **Open the File**: Once the download completes, tap on the downloaded `.apk` file in your browser's downloads list or your file manager.
3. **Allow Unknown Sources**: 
   - If prompted that your phone is not allowed to install unknown apps from this source, tap **Settings** on the prompt.
   - Toggle the switch to **Allow from this source**.
   - Tap the back button to return to the installation screen.
4. **Install**: Tap **Install**.
5. **Open**: Once installed, tap **Open** to launch the app.

---

## Testing Credentials

### Customer App
- **Account**: You can register a new test account directly from the login/signup screen within the app using an email or phone number.

### Operations App

No shared or default staff login credentials are distributed with the application. Ask an authorized administrator to create named test-only accounts in the staging database and deliver the credentials through a secure channel. Use distinct passwords, enable MFA where available, and limit permissions to the test roles.

**Security notice:** Earlier versions of this document contained example staff and manager credentials. Treat those passwords as exposed. Rotate the credentials of any account using them, revoke existing sessions and API tokens as appropriate, and verify that no production account uses published test credentials. Removing the text from the latest commit does not erase Git history.
