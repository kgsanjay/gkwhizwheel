export interface AttractionCoordinates {
  latitude: number;
  longitude: number;
}

export type AttractionCategory = 'all' | 'beach_river' | 'heritage' | 'nature_falls';

export interface AttractionPOI {
  id: string;
  title: string;
  subtitle: string;
  distance: string;
  transport: string;
  coordinates: AttractionCoordinates;
  mapLabel: string;
  color: string;
  emoji: string;
  category: AttractionCategory;
  tags: string[];
  description: string;
  highlights: string[];
  recommendedDuration: string;
}

export const ATTRACTIONS_DATA: AttractionPOI[] = [
  {
    id: 'sharavathi-backwaters',
    title: 'Sharavathi Backwaters & Boating',
    subtitle: 'Mangrove Channels & Sunset Cruises',
    distance: '8 km from Honnavar Hub',
    transport: '🛵 Bike / 🚤 Boat',
    coordinates: {
      latitude: 14.2831,
      longitude: 74.4534,
    },
    mapLabel: 'Sharavathi Estuary, Honnavar',
    color: '#059669',
    emoji: '🚤',
    category: 'beach_river',
    tags: ['Mangrove Estuary', 'Sunset Cruise', 'Kayaking'],
    description:
      'Cruising across the Sharavathi bridges and mangrove channels offers calm water reflections, estuary sunsets where the river meets the Arabian sea, and serene Shikara rides.',
    highlights: [
      'Dense coastal mangrove island channels',
      'Spectacular sunset where river merges with the Arabian Sea',
      'Shikara boats, motor cruises & self-paddle kayaking',
    ],
    recommendedDuration: '2 - 3 Hours',
  },
  {
    id: 'eco-beach-boardwalk',
    title: 'Honnavar Eco Beach & Boardwalk',
    subtitle: 'Kasarkod Blue Flag Promenade',
    distance: '4 km from Honnavar Hub',
    transport: '🛵 Bike / 🚖 Cab',
    coordinates: {
      latitude: 14.2711,
      longitude: 74.4312,
    },
    mapLabel: 'Kasarkod Eco Beach, Honnavar',
    color: '#0284C7',
    emoji: '🏖️',
    category: 'beach_river',
    tags: ['Blue Flag Beach', 'Wooden Promenade', 'Sunset Walk'],
    description:
      'Certified eco-beach featuring a picturesque wooden promenade winding through rich coastal mangroves. Ideal for gentle evening rides, nature photography, and sea breezes.',
    highlights: [
      'Elevated wooden boardwalk meandering through mangroves',
      'Clean golden sands with eco-certified amenities',
      'Secluded coastal sunset photography spot',
    ],
    recommendedDuration: '1.5 - 2 Hours',
  },
  {
    id: 'apsarakonda-falls',
    title: 'Apsarakonda Waterfalls & Hill',
    subtitle: 'Natural Lagoon & Pandava Caves',
    distance: '7 km South (NH66)',
    transport: '🛵 Bike / 🚖 Cab',
    coordinates: {
      latitude: 14.2389,
      longitude: 74.4518,
    },
    mapLabel: 'Apsarakonda Hill, Honnavar',
    color: '#D97706',
    emoji: '🌊',
    category: 'nature_falls',
    tags: ['Freshwater Cascade', 'Natural Lagoon', 'Cliff View'],
    description:
      'A natural freshwater cascade flowing into an emerald pool with ancient Pandava caves, accompanied by a panoramic cliff-top hill garden viewpoint over the Arabian Sea.',
    highlights: [
      'Sweet freshwater natural plunge bath',
      'Ancient laterite rock-cut Pandava caves',
      'Hill-top viewpoint garden overlooking the sea',
    ],
    recommendedDuration: '2 Hours',
  },
  {
    id: 'mirjan-fort',
    title: 'Mirjan Fort Historic Ramparts',
    subtitle: '16th Century Fortress of Queen Chennabhairadevi',
    distance: '22 km North (NH66)',
    transport: '🛵 Bike / 🚖 Cab',
    coordinates: {
      latitude: 14.4922,
      longitude: 74.4215,
    },
    mapLabel: 'Mirjan Fort, Mirjan',
    color: '#7C3AED',
    emoji: '🏰',
    category: 'heritage',
    tags: ['16th Century Queen', 'Laterite Architecture', 'Highway Ride'],
    description:
      'Built in the 16th century by Queen Chennabhairadevi (the Pepper Queen), this historic citadel features moss-covered laterite watchtowers, hidden moats, and lush green lawns.',
    highlights: [
      'Majestic mossy laterite watchtowers & secret tunnels',
      'Rich history of the 54-year reign of the Pepper Queen',
      'Scenic highway cruise along coastal NH66 towards Gokarna',
    ],
    recommendedDuration: '2 - 3 Hours',
  },
  {
    id: 'murudeshwar-temple',
    title: 'Murudeshwar Shiva Temple & Sea',
    subtitle: '123-Ft Colossal Statue & Netrani Base',
    distance: '27 km South (NH66)',
    transport: '🚖 Cab / 🛵 Bike',
    coordinates: {
      latitude: 14.094,
      longitude: 74.4849,
    },
    mapLabel: 'Kanduka Hill, Murudeshwar',
    color: '#E11D48',
    emoji: '🔱',
    category: 'heritage',
    tags: ['World Tallest Shiva', 'Raja Gopuram', 'Netrani Base'],
    description:
      'Home to the world’s 2nd tallest Shiva statue seated on Kanduka hill surrounded by the sea on three sides, 20-storey Raja Gopuram, and departure port for Netrani scuba diving.',
    highlights: [
      'Colossal 123-foot Lord Shiva statue on ocean promontory',
      'High-speed elevator to the 18th floor of the Raja Gopuram',
      'Speedboat departure hub for Netrani Island scuba expeditions',
    ],
    recommendedDuration: 'Half Day (3 - 4 Hours)',
  },
  {
    id: 'gokarna-beaches',
    title: 'Gokarna Om & Kudle Beaches',
    subtitle: 'Iconic Coastline & Coastal Cafe Hopping',
    distance: '48 km North (NH66)',
    transport: '🚖 Cab / 🛵 Bike',
    coordinates: {
      latitude: 14.5218,
      longitude: 74.3168,
    },
    mapLabel: 'Om Beach, Gokarna',
    color: '#2563EB',
    emoji: '🕉️',
    category: 'beach_river',
    tags: ['Om Beach', 'Kudle Coastline', 'Temple Town'],
    description:
      'The quintessential Karnataka coastal highway road trip. Cruise on a Royal Enfield or hire an AC cab from Honnavar to Om Beach, beach-trek to Paradise Beach, and explore temple streets.',
    highlights: [
      'Naturally formed Om (ॐ) shaped crescent beaches',
      'Cliffside beach cafes with fresh coastal juices and seafood',
      'Scenic NH66 highway bridges across Aghanashini river',
    ],
    recommendedDuration: 'Full Day (6 - 8 Hours)',
  },
];
