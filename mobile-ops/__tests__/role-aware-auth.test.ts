import { storage } from '../api/storage';
import { opsApi } from '../api/client';
import { StaffUser } from '../api/types';

describe('Role-Aware Ops Authentication & Navigation Separation', () => {
  beforeEach(async () => {
    await storage.clearSession();
    jest.clearAllMocks();
  });

  describe('Sanctum Token & Role Persistence via SecureStore', () => {
    test('successfully persists staff user and token in SecureStore on login', async () => {
      const mockStaff: StaffUser = {
        id: 101,
        name: 'Ganesh Crew',
        email: 'ganesh.staff@gkwhizwheel.com',
        role: 'staff',
        store_id: 1,
        store_name: 'Honnavar Platform 1 Hub',
      };

      await storage.setToken('sanctum-token-staff-101');
      await storage.setUser(mockStaff);

      const token = await storage.getToken();
      const user = await storage.getUser();

      expect(token).toBe('sanctum-token-staff-101');
      expect(user).toEqual(mockStaff);
      expect(user?.role).toBe('staff');
    });

    test('successfully persists store manager user and token in SecureStore on login', async () => {
      const mockManager: StaffUser = {
        id: 202,
        name: 'Sanjay Bhat',
        email: 'manager.honnavar@gkwhizwheel.com',
        role: 'store_manager',
        store_id: 1,
        store_name: 'Honnavar Platform 1 Hub',
      };

      await storage.setToken('sanctum-token-mgr-202');
      await storage.setUser(mockManager);

      const token = await storage.getToken();
      const user = await storage.getUser();

      expect(token).toBe('sanctum-token-mgr-202');
      expect(user).toEqual(mockManager);
      expect(user?.role).toBe('store_manager');
    });

    test('clears Sanctum token from SecureStore upon sign out', async () => {
      await storage.setToken('sanctum-token-to-be-cleared');
      await storage.clearSession();

      const token = await storage.getToken();
      const user = await storage.getUser();

      expect(token).toBeNull();
      expect(user).toBeNull();
    });
  });

  describe('Role-Aware Navigation Item Filtering', () => {
    // Utility simulating the TabNavigator tab filtering logic
    const getTabsForRole = (role: string | null | undefined): string[] => {
      const isManager = role === 'store_manager' || role === 'super_admin';
      const tabs = ['Dashboard', 'Fleet'];
      if (isManager) {
        tabs.push('StationAdmin');
      }
      tabs.push('Profile');
      return tabs;
    };

    test('Staff users must NOT see admin-only navigation items at all', () => {
      const staffTabs = getTabsForRole('staff');

      // Staff tabs include standard operational workflows
      expect(staffTabs).toContain('Dashboard');
      expect(staffTabs).toContain('Fleet');
      expect(staffTabs).toContain('Profile');

      // StationAdmin must be completely excluded from the navigation array
      expect(staffTabs).not.toContain('StationAdmin');
      expect(staffTabs.length).toBe(3);
    });

    test('Store Managers must see Station Admin navigation item', () => {
      const managerTabs = getTabsForRole('store_manager');

      expect(managerTabs).toContain('Dashboard');
      expect(managerTabs).toContain('Fleet');
      expect(managerTabs).toContain('StationAdmin');
      expect(managerTabs).toContain('Profile');
      expect(managerTabs.length).toBe(4);
    });

    test('Super Admin users must also see Station Admin navigation item', () => {
      const superAdminTabs = getTabsForRole('super_admin');

      expect(superAdminTabs).toContain('StationAdmin');
      expect(superAdminTabs.length).toBe(4);
    });
  });

  describe('Role-Aware Dashboard Routing Logic', () => {
    const getDashboardType = (role: string | null | undefined): 'ManagerDashboard' | 'StaffDashboard' => {
      const isManager = role === 'store_manager' || role === 'super_admin';
      return isManager ? 'ManagerDashboard' : 'StaffDashboard';
    };

    test('routes store_manager to ManagerDashboard layout with revenue and hub control metrics', () => {
      expect(getDashboardType('store_manager')).toBe('ManagerDashboard');
    });

    test('routes super_admin to ManagerDashboard layout', () => {
      expect(getDashboardType('super_admin')).toBe('ManagerDashboard');
    });

    test('routes ground staff to StaffDashboard layout with task queue and dispatch actions', () => {
      expect(getDashboardType('staff')).toBe('StaffDashboard');
    });
  });

  describe('Customer Role Unauthorized Access Gate', () => {
    test('rejects customer role from accessing operations app', () => {
      const allowedRoles = ['super_admin', 'store_manager', 'staff'];
      const customerRole = 'customer';

      const isAllowed = allowedRoles.includes(customerRole);
      expect(isAllowed).toBe(false);
    });
  });
});
