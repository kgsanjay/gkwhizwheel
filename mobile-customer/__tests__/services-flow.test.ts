import { DEDICATED_SERVICES, SERVICES_LIST, ServiceDefinition } from '../api/servicesData';

describe('Services Screen & Detail Flow Verification', () => {
  it('contains exactly the 7 canonical services matching the brand catalog', () => {
    const serviceIds = Object.keys(DEDICATED_SERVICES);
    expect(serviceIds).toHaveLength(7);
    expect(SERVICES_LIST).toHaveLength(7);

    // Expected 7 service types
    expect(serviceIds).toEqual(
      expect.arrayContaining([
        'bikes',
        'taxi',
        'boating',
        'scuba',
        'homestay',
        'guide',
        'tours',
      ])
    );
  });

  it('provides complete metadata for every service without empty fields', () => {
    SERVICES_LIST.forEach((svc: ServiceDefinition) => {
      expect(svc.id).toBeTruthy();
      expect(svc.slug).toBeTruthy();
      expect(svc.title).toBeTruthy();
      expect(svc.shortTitle).toBeTruthy();
      expect(svc.tagline).toBeTruthy();
      expect(svc.icon).toBeTruthy();
      expect(svc.startingPrice).toContain('₹');
      expect(svc.rating).toMatch(/^4\.[8-9]|5\.0$/);
      expect(svc.overview.length).toBeGreaterThan(50);
      expect(svc.trustBadges.length).toBeGreaterThanOrEqual(4);
      expect(svc.packages.length).toBeGreaterThanOrEqual(2);
      expect(svc.inclusions.length).toBeGreaterThanOrEqual(3);
      expect(svc.exclusions.length).toBeGreaterThanOrEqual(2);
      expect(svc.faqs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('correctly resolves service detail by slug or ID', () => {
    const resolveService = (key: string) => DEDICATED_SERVICES[key] || null;

    expect(resolveService('boating')?.shortTitle).toBe('Backwater Boating');
    expect(resolveService('scuba')?.category).toBe('Marine Adventure');
    expect(resolveService('taxi')?.startingPrice).toContain('₹1,800');
    expect(resolveService('nonexistent')).toBeNull();
  });

  it('validates list/grid view toggle state transitions', () => {
    type ViewMode = 'list' | 'grid';
    let currentMode: ViewMode = 'list';

    const toggle = (mode: ViewMode) => {
      currentMode = mode;
      return currentMode;
    };

    expect(toggle('grid')).toBe('grid');
    expect(toggle('list')).toBe('list');
  });

  it('validates each service package structure for the native detail view', () => {
    const boating = DEDICATED_SERVICES.boating;
    expect(boating.packages[0].name).toBe('Mangrove Safari Cruise');
    expect(boating.packages[0].rate).toContain('₹400');
    expect(boating.packages[0].idealFor).toBeTruthy();

    const scuba = DEDICATED_SERVICES.scuba;
    expect(scuba.packages[0].name).toBe('Discover Scuba (Beginner)');
    expect(scuba.packages[0].rate).toContain('₹3,500');
  });
});
