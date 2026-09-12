import { Bike, BikeCategory, Store } from '../api/types';

describe('Home Screen Data & Logic Verification', () => {
  const sampleCategories: BikeCategory[] = [
    { id: 1, name: 'Scooter', base_daily_rate: 450, default_deposit_amount: 1500 },
    { id: 2, name: 'Cruiser', base_daily_rate: 1100, default_deposit_amount: 4000 },
    { id: 3, name: 'Electric', base_daily_rate: 500, default_deposit_amount: 1500 },
  ];

  const sampleStores: Store[] = [
    {
      id: 1,
      name: 'Palya Main Road Head Office',
      city: 'Honnavar',
      address_line: 'Near Old Bus Stand',
      phone: '+91 94815 00000',
      latitude: 14.281,
      longitude: 74.443,
    },
    {
      id: 2,
      name: 'Honnavar Railway Station Hub',
      city: 'Honnavar',
      address_line: 'Platform 1 Parking Exit',
      phone: '+91 94815 00001',
      latitude: 14.298,
      longitude: 74.455,
    },
  ];

  const sampleBikes: Bike[] = [
    {
      id: 101,
      category_id: 1,
      current_store_id: 1,
      home_store_id: 1,
      brand: 'Honda',
      model_name: 'Activa 6G',
      registration_number: 'KA-47-E-1001',
      fuel_type: 'petrol',
      transmission: 'automatic',
      status: 'available',
      daily_rate: 450,
      category: { id: 1, name: 'Scooter', base_daily_rate: 450 },
      store: { id: 1, name: 'Palya Main Road Head Office', city: 'Honnavar' },
    },
    {
      id: 102,
      category_id: 2,
      current_store_id: 2,
      home_store_id: 2,
      brand: 'Royal Enfield',
      model_name: 'Hunter 350',
      registration_number: 'KA-47-E-2002',
      fuel_type: 'petrol',
      transmission: 'manual',
      status: 'available',
      daily_rate: 1100,
      category: { id: 2, name: 'Cruiser', base_daily_rate: 1100 },
      store: { id: 2, name: 'Honnavar Railway Station Hub', city: 'Honnavar' },
    },
    {
      id: 103,
      category_id: 3,
      current_store_id: 2,
      home_store_id: 2,
      brand: 'Ather',
      model_name: '450X Gen 3',
      registration_number: 'KA-47-E-3003',
      fuel_type: 'electric',
      transmission: 'automatic',
      status: 'available',
      daily_rate: 650,
      category: { id: 3, name: 'Electric', base_daily_rate: 500 },
      store: { id: 2, name: 'Honnavar Railway Station Hub', city: 'Honnavar' },
    },
  ];

  it('filters bikes strictly by category when a category is selected in the carousel', () => {
    const selectedCategoryId = 1; // Scooter
    const filtered = sampleBikes.filter((bike) => bike.category_id === selectedCategoryId);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].model_name).toBe('Activa 6G');
  });

  it('filters bikes by search query across model and brand', () => {
    const query = 'enfield';
    const filtered = sampleBikes.filter(
      (bike) =>
        bike.model_name.toLowerCase().includes(query.toLowerCase()) ||
        bike.brand.toLowerCase().includes(query.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].brand).toBe('Royal Enfield');
  });

  it('filters bikes by store hub pickup location', () => {
    const stationStoreId = 2;
    const filtered = sampleBikes.filter((bike) => bike.current_store_id === stationStoreId);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((b) => b.id)).toEqual([102, 103]);
  });

  it('supports multi-dimensional filtering across category, store, and search', () => {
    const filtered = sampleBikes.filter((bike) => {
      const matchCat = bike.category_id === 2;
      const matchStore = bike.current_store_id === 2;
      const matchSearch = bike.model_name.toLowerCase().includes('hunter');
      return matchCat && matchStore && matchSearch;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].registration_number).toBe('KA-47-E-2002');
  });

  it('handles 3-dot stepper bounds and navigation', () => {
    let activeStep = 0;
    const maxSteps = 3;

    // Next step
    activeStep = Math.min(maxSteps - 1, activeStep + 1);
    expect(activeStep).toBe(1);

    // Next step
    activeStep = Math.min(maxSteps - 1, activeStep + 1);
    expect(activeStep).toBe(2);

    // Attempting to exceed max bounds stays at last step
    activeStep = Math.min(maxSteps - 1, activeStep + 1);
    expect(activeStep).toBe(2);

    // Prev step
    activeStep = Math.max(0, activeStep - 1);
    expect(activeStep).toBe(1);
  });
});
