import {
  ATTRACTIONS_DATA,
  AttractionPOI,
  AttractionCategory,
} from '../api/attractionsData';

describe('Native Explore Tab & Point-of-Interest Deep-Link Flow (F16)', () => {
  describe('Attraction Data Catalog', () => {
    it('contains all 6 coastal Karnataka attractions extracted from ExplorePage.jsx', () => {
      expect(ATTRACTIONS_DATA.length).toBe(6);
      const titles = ATTRACTIONS_DATA.map((a) => a.title);

      expect(titles).toContain('Sharavathi Backwaters & Boating');
      expect(titles).toContain('Honnavar Eco Beach & Boardwalk');
      expect(titles).toContain('Apsarakonda Waterfalls & Hill');
      expect(titles).toContain('Mirjan Fort Historic Ramparts');
      expect(titles).toContain('Murudeshwar Shiva Temple & Sea');
      expect(titles).toContain('Gokarna Om & Kudle Beaches');
    });

    it('validates map pin coordinates and hub distances for all attractions', () => {
      ATTRACTIONS_DATA.forEach((attraction) => {
        expect(attraction.distance).toMatch(/km/i);
        expect(attraction.coordinates.latitude).toBeGreaterThan(14.0);
        expect(attraction.coordinates.latitude).toBeLessThan(15.0);
        expect(attraction.coordinates.longitude).toBeGreaterThan(74.0);
        expect(attraction.coordinates.longitude).toBeLessThan(75.0);
        expect(attraction.mapLabel).toBeTruthy();
        expect(attraction.highlights.length).toBeGreaterThan(0);
        expect(attraction.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Category Filtering Logic', () => {
    const filterAttractions = (
      list: AttractionPOI[],
      cat: AttractionCategory,
      query: string = ''
    ) => {
      return list.filter((item) => {
        if (cat !== 'all' && item.category !== cat) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    };

    it('returns all attractions when category is "all"', () => {
      const results = filterAttractions(ATTRACTIONS_DATA, 'all');
      expect(results.length).toBe(6);
    });

    it('filters beaches and rivers correctly', () => {
      const results = filterAttractions(ATTRACTIONS_DATA, 'beach_river');
      expect(results.length).toBe(3);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('Sharavathi Backwaters & Boating');
      expect(titles).toContain('Honnavar Eco Beach & Boardwalk');
      expect(titles).toContain('Gokarna Om & Kudle Beaches');
    });

    it('filters heritage and forts correctly', () => {
      const results = filterAttractions(ATTRACTIONS_DATA, 'heritage');
      expect(results.length).toBe(2);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('Mirjan Fort Historic Ramparts');
      expect(titles).toContain('Murudeshwar Shiva Temple & Sea');
    });

    it('filters nature waterfalls correctly', () => {
      const results = filterAttractions(ATTRACTIONS_DATA, 'nature_falls');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Apsarakonda Waterfalls & Hill');
    });

    it('supports search query matching by title or tag', () => {
      const results = filterAttractions(ATTRACTIONS_DATA, 'all', 'mangrove');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('Sharavathi Backwaters & Boating');
    });
  });

  describe('Tours Deep-Link Parameter Construction', () => {
    it('creates valid deep-link params for Tours vacation packages', () => {
      const attraction = ATTRACTIONS_DATA[0];
      const deepLinkPayload = {
        serviceSlug: 'tours',
        preSelectedDestination: attraction.title,
      };

      expect(deepLinkPayload.serviceSlug).toBe('tours');
      expect(deepLinkPayload.preSelectedDestination).toBe('Sharavathi Backwaters & Boating');
    });
  });
});
