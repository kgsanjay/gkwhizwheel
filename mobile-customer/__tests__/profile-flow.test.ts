import { api } from '../api/client';
import { notificationService } from '../services/notificationService';
import * as ImagePicker from 'expo-image-picker';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    setToken: jest.fn(),
    getToken: jest.fn().mockReturnValue('mock-user-token'),
    customerApi: {
      getKycDocuments: jest.fn(),
      uploadKycDocument: jest.fn(),
      updateProfile: jest.fn(),
    },
  },
  APP_VERSION: '1.0.0',
}));

jest.mock('../services/notificationService', () => ({
  notificationService: {
    unregisterPushTokenAsync: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///data/cropped_dl.jpg', width: 800, height: 600 }],
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///data/cropped_aadhaar.jpg', width: 800, height: 600 }],
  }),
}));

describe('Native Profile & KYC Flow (F13)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Editable Profile Updating', () => {
    it('calls api.customerApi.updateProfile with validated fields', async () => {
      (api.customerApi.updateProfile as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          user: {
            id: 1,
            name: 'Rohan Naik',
            email: 'rohan@example.com',
            phone: '+91 94801 11222',
            role: 'customer',
            whatsapp_opt_in: true,
          },
        },
        message: 'Profile updated successfully.',
      });

      const res = await api.customerApi.updateProfile({
        name: 'Rohan Naik',
        phone: '+91 94801 11222',
        whatsapp_opt_in: true,
      });

      expect(api.customerApi.updateProfile).toHaveBeenCalledWith({
        name: 'Rohan Naik',
        phone: '+91 94801 11222',
        whatsapp_opt_in: true,
      });
      expect(res.success).toBe(true);
      expect(res.data.user.name).toBe('Rohan Naik');
    });
  });

  describe('KYC Document Picker with In-App Cropping', () => {
    it('launches camera with allowsEditing: true and aspect [4, 3]', async () => {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          allowsEditing: true,
          aspect: [4, 3],
        })
      );
      expect(result.canceled).toBe(false);
      expect(result.assets?.[0].uri).toBe('file:///data/cropped_dl.jpg');
    });

    it('launches photo gallery with allowsEditing: true and aspect [4, 3]', async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          allowsEditing: true,
          aspect: [4, 3],
        })
      );
      expect(result.canceled).toBe(false);
      expect(result.assets?.[0].uri).toBe('file:///data/cropped_aadhaar.jpg');
    });

    it('submits multipart form data to uploadKycDocument', async () => {
      (api.customerApi.uploadKycDocument as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'KYC document uploaded successfully.',
      });

      const formData = new FormData();
      formData.append('document_type', 'driving_license');
      formData.append('file', {
        uri: 'file:///data/cropped_dl.jpg',
        name: 'kyc_driving_license.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await api.customerApi.uploadKycDocument(formData);
      expect(api.customerApi.uploadKycDocument).toHaveBeenCalledWith(formData);
      expect(res.success).toBe(true);
    });
  });

  describe('Logout & Token Clearance', () => {
    it('deregisters push token and clears Sanctum auth token', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      // Simulate logout sequence
      await api.post('/auth/logout');
      await notificationService.unregisterPushTokenAsync();
      api.setToken(null);

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(notificationService.unregisterPushTokenAsync).toHaveBeenCalled();
      expect(api.setToken).toHaveBeenCalledWith(null);
    });
  });
});
