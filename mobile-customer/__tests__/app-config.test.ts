import appJson from '../app.json';

describe('App Configuration & Store Permissions (F17)', () => {
  const expoConfig = appJson.expo;

  describe('Basic App Metadata', () => {
    it('sets official app name to "GK WhizWheel"', () => {
      expect(expoConfig.name).toBe('GK WhizWheel');
      expect(expoConfig.slug).toBe('gkwhizwheel-customer');
      expect(expoConfig.scheme).toBe('gkwhizwheel');
    });

    it('defines matching bundle identifiers for iOS and Android', () => {
      expect(expoConfig.ios.bundleIdentifier).toBe('com.gkwhizwheel.customer');
      expect(expoConfig.android.package).toBe('com.gkwhizwheel.customer');
    });

    it('configures dark navy splash screen', () => {
      expect(expoConfig.splash.backgroundColor).toBe('#0F172A');
      expect(expoConfig.splash.resizeMode).toBe('contain');
      expect(expoConfig.splash.image).toBe('./assets/splash-icon.png');
    });
  });

  describe('Brand Assets Integrity', () => {
    it('configures paths to brand assets generated from F4 theme', () => {
      expect(expoConfig.icon).toBe('./assets/icon.png');
      expect(expoConfig.splash.image).toBe('./assets/splash-icon.png');
      expect(expoConfig.android.adaptiveIcon.foregroundImage).toBe('./assets/android-icon-foreground.png');
      expect(expoConfig.android.adaptiveIcon.backgroundImage).toBe('./assets/android-icon-background.png');
      expect(expoConfig.android.adaptiveIcon.monochromeImage).toBe('./assets/android-icon-monochrome.png');
      expect(expoConfig.android.adaptiveIcon.backgroundColor).toBe('#0F172A');
      expect(expoConfig.web.favicon).toBe('./assets/favicon.png');
    });
  });

  describe('iOS App Store Review Permissions (infoPlist)', () => {
    const infoPlist = expoConfig.ios.infoPlist;

    it('declares detailed NSCameraUsageDescription for KYC and bike handover', () => {
      expect(infoPlist.NSCameraUsageDescription).toBeDefined();
      expect(infoPlist.NSCameraUsageDescription).toMatch(/camera access/i);
      expect(infoPlist.NSCameraUsageDescription).toMatch(/KYC/i);
    });

    it('declares detailed NSPhotoLibraryUsageDescription for document upload', () => {
      expect(infoPlist.NSPhotoLibraryUsageDescription).toBeDefined();
      expect(infoPlist.NSPhotoLibraryUsageDescription).toMatch(/photo library/i);
      expect(infoPlist.NSPhotoLibraryUsageDescription).toMatch(/Driving License/i);
    });

    it('declares detailed NSLocationWhenInUseUsageDescription for station hubs', () => {
      expect(infoPlist.NSLocationWhenInUseUsageDescription).toBeDefined();
      expect(infoPlist.NSLocationWhenInUseUsageDescription).toMatch(/location/i);
      expect(infoPlist.NSLocationWhenInUseUsageDescription).toMatch(/station hub/i);
    });

    it('declares NSLocationAlwaysAndWhenInUseUsageDescription for roadside assistance', () => {
      expect(infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription).toBeDefined();
      expect(infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription).toMatch(/roadside assistance/i);
    });
  });

  describe('Android Permissions & Plugins', () => {
    const permissions = expoConfig.android.permissions;

    it('includes essential runtime permissions', () => {
      expect(permissions).toContain('android.permission.CAMERA');
      expect(permissions).toContain('android.permission.ACCESS_FINE_LOCATION');
      expect(permissions).toContain('android.permission.ACCESS_COARSE_LOCATION');
      expect(permissions).toContain('android.permission.POST_NOTIFICATIONS');
    });

    it('configures Expo plugins with usage strings', () => {
      const pluginNames = expoConfig.plugins.map((p: any) =>
        Array.isArray(p) ? p[0] : p
      );

      expect(pluginNames).toContain('expo-secure-store');
      expect(pluginNames).toContain('expo-image-picker');
      expect(pluginNames).toContain('expo-location');
      expect(pluginNames).toContain('expo-notifications');
      expect(pluginNames).toContain('expo-sharing');
    });
  });
});
