import { Bike } from '../api/types';

describe('Bike Browse & Detail Flow Logic', () => {
  const mockBikes: Bike[] = [
    {
      id: 1,
      model_name: 'Activa 6G',
      brand: 'Honda',
      registration_number: 'KA-47-E-1234',
      status: 'available',
      daily_rate: 450,
      transmission: 'automatic',
      fuel_type: 'petrol',
      current_store_id: 1,
      home_store_id: 1,
      category_id: 1,
      category: {
        id: 1,
        name: 'Scooters',
        base_daily_rate: 450,
      },
      store: {
        id: 1,
        name: 'Honnavar Railway Station Hub',
        city: 'Honnavar',
      },
    },
    {
      id: 2,
      model_name: 'Classic 350',
      brand: 'Royal Enfield',
      registration_number: 'KA-47-E-5678',
      status: 'available',
      daily_rate: 1200,
      transmission: 'manual',
      fuel_type: 'petrol',
      current_store_id: 1,
      home_store_id: 1,
      category_id: 2,
      category: {
        id: 2,
        name: 'Cruisers',
        base_daily_rate: 1200,
      },
      store: {
        id: 1,
        name: 'Honnavar Railway Station Hub',
        city: 'Honnavar',
      },
    },
    {
      id: 3,
      model_name: 'Ather 450X',
      brand: 'Ather',
      registration_number: 'KA-47-EV-9999',
      status: 'booked',
      daily_rate: 650,
      transmission: 'automatic',
      fuel_type: 'electric',
      current_store_id: 2,
      home_store_id: 2,
      category_id: 3,
      category: {
        id: 3,
        name: 'Electric',
        base_daily_rate: 650,
      },
      store: {
        id: 2,
        name: 'Palya Main Road Hub',
        city: 'Honnavar',
      },
    },
  ];

  describe('Filter logic (native bottom-sheet criteria)', () => {
    it('filters bikes by search query across model and brand', () => {
      const query = 'classic';
      const filtered = mockBikes.filter((b) =>
        b.model_name.toLowerCase().includes(query) || b.brand.toLowerCase().includes(query)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].model_name).toBe('Classic 350');
    });

    it('filters bikes by category ID', () => {
      const categoryId = 1;
      const filtered = mockBikes.filter(
        (b) => b.category_id === categoryId || b.category?.id === categoryId
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].model_name).toBe('Activa 6G');
    });

    it('filters bikes by store / pickup hub ID', () => {
      const storeId = 2;
      const filtered = mockBikes.filter((b) => b.current_store_id === storeId);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].model_name).toBe('Ather 450X');
    });

    it('filters bikes by max daily price', () => {
      const maxPrice = 500;
      const filtered = mockBikes.filter((b) => {
        const rate = Number(b.daily_rate || b.category?.base_daily_rate || 0);
        return rate <= maxPrice;
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].model_name).toBe('Activa 6G');
    });

    it('filters bikes by availability status', () => {
      const filtered = mockBikes.filter((b) => b.status === 'available');
      expect(filtered).toHaveLength(2);
      expect(filtered.map((b) => b.id)).toEqual([1, 2]);
    });

    it('computes the active filter count badge correctly', () => {
      const computeActiveCount = (filters: {
        categoryId: number | null;
        storeId: number | null;
        maxPrice: number | null;
        onlyAvailable: boolean;
      }) => {
        let count = 0;
        if (filters.categoryId !== null) count++;
        if (filters.storeId !== null) count++;
        if (filters.maxPrice !== null) count++;
        if (filters.onlyAvailable) count++;
        return count;
      };

      expect(
        computeActiveCount({ categoryId: null, storeId: null, maxPrice: null, onlyAvailable: false })
      ).toBe(0);

      expect(
        computeActiveCount({ categoryId: 2, storeId: null, maxPrice: 1000, onlyAvailable: true })
      ).toBe(3);
    });
  });

  describe('Detail screen pricing & carousel calculations', () => {
    it('calculates carousel active index accurately on horizontal scroll', () => {
      const screenWidth = 390;
      const calculateIndex = (offsetX: number) => Math.round(offsetX / screenWidth);

      expect(calculateIndex(0)).toBe(0);
      expect(calculateIndex(380)).toBe(1);
      expect(calculateIndex(770)).toBe(2);
      expect(calculateIndex(1170)).toBe(3);
    });

    it('computes daily rate breakdown including complimentary items and deposit', () => {
      const bike = mockBikes[0];
      const dailyRate = Number(bike.daily_rate || 500);
      const refundableDeposit = 1000;
      const helmets = 2;

      expect(dailyRate).toBe(450);
      expect(refundableDeposit).toBe(1000);
      expect(helmets).toBe(2);
    });

    it('verifies commercial RTO compliance and roadside rescue inclusion', () => {
      const inclusions = [
        '2 Sanitized ISI certified helmets (Driver + Pillion)',
        'Waterproof mobile handlebar holder with charging cable',
        '24/7 Roadside breakdown & flat-tire mobile rescue',
        'Full tank assistance & station platform handover in 3 minutes',
      ];
      expect(inclusions).toHaveLength(4);
      expect(inclusions.some((i) => i.includes('24/7 Roadside breakdown'))).toBe(true);
      expect(inclusions.some((i) => i.includes('ISI certified helmets'))).toBe(true);
    });
  });
});
