export interface ServicePackage {
  name: string;
  modelsOrDetails: string;
  rate: string;
  idealFor: string;
}

export interface TrustBadge {
  title: string;
  desc: string;
}

export interface ServiceFAQ {
  q: string;
  a: string;
}

export interface ServiceDefinition {
  id: string;
  slug: string;
  serviceType: string;
  title: string;
  shortTitle: string;
  tagline: string;
  category: string;
  color: string;
  icon: string;
  startingPrice: string;
  rating: string;
  reviewCount: string;
  overview: string;
  trustBadges: TrustBadge[];
  packages: ServicePackage[];
  inclusions: string[];
  exclusions: string[];
  faqs: ServiceFAQ[];
}

export const DEDICATED_SERVICES: Record<string, ServiceDefinition> = {
  bikes: {
    id: 'bikes',
    slug: 'bikes',
    serviceType: 'two_wheelers',
    title: 'Two-Wheeler & Scooter Rentals in Honnavar',
    shortTitle: 'Bike & Scooter Rentals',
    tagline: 'Cruise Coastal NH66, Gokarna beaches & Jog Falls on your own terms',
    category: 'Self-Drive Rentals',
    color: '#F59E0B',
    icon: '🛵',
    startingPrice: 'From ₹350 / day',
    rating: '5.0',
    reviewCount: '320+',
    overview:
      'GK WhizWheels is Honnavar’s largest and most trusted two-wheeler rental agency. We provide sanitized, regularly serviced cruiser motorcycles and gearless automatic scooters. With dual hubs at Palya Main Road and right outside Honnavar Railway Station Platform 1, you can step off your train and be on the road in 3 minutes.',
    trustBadges: [
      { title: 'Zero Security Deposit', desc: 'Available on Aadhaar & round-trip verification' },
      { title: 'Station Platform 1 Delivery', desc: 'Bike waiting right outside as soon as your train arrives' },
      { title: '2 Free Sanitized Helmets', desc: 'ISI helmets + phone mount & charger adapter included' },
      { title: '24/7 Roadside Rescue', desc: 'On-call breakdown helpline across Uttara Kannada' },
    ],
    packages: [
      {
        name: 'Gearless Scooters',
        modelsOrDetails: 'Honda Activa 6G, Suzuki Access 125, TVS Ntorq',
        rate: '₹350 - ₹500 / day',
        idealFor: 'Eco Beach, Sharavathi backwaters & local Honnavar town sightseeing',
      },
      {
        name: 'Cruiser Motorcycles',
        modelsOrDetails: 'Royal Enfield Classic 350, Honda H\'ness CB350, Hunter 350',
        rate: '₹1,000 - ₹1,400 / day',
        idealFor: 'Gokarna, Murudeshwar coastal highways & Jog Falls mountain ghats',
      },
      {
        name: 'Electric Scooters (EV)',
        modelsOrDetails: 'Smart Electric Two-Wheelers with Portable Charger',
        rate: '₹450 - ₹600 / day',
        idealFor: 'Eco-friendly quiet rides around Honnavar town & Sharavathi river',
      },
    ],
    inclusions: [
      '2 Sanitized ISI certified helmets',
      'Valid Commercial RC copy, Insurance & PUC',
      '24/7 Roadside breakdown support in Honnavar',
      'Mobile holder & charger adapter (on request)',
      'Sufficient fuel to reach nearest fuel station',
    ],
    exclusions: [
      'Fuel consumed during rental period',
      'Toll charges on NH66 (if applicable)',
      'Traffic violation fines incurred by rider',
    ],
    faqs: [
      {
        q: 'What documents do I need to rent a bike in Honnavar?',
        a: 'A valid original Indian Driving License (or International Driving Permit for foreign nationals) plus one government photo ID (Aadhaar, Passport, or Voter ID).',
      },
      {
        q: 'Can I pick up at Honnavar Railway Station and return in town?',
        a: 'Yes! We support flexible hub pickups and drop-offs between our Railway Station parking hub and Palya Main Road head office.',
      },
    ],
  },

  taxi: {
    id: 'taxi',
    slug: 'taxi',
    serviceType: 'taxi',
    title: 'Private Cab & Taxi Services in Honnavar',
    shortTitle: 'Cab & Taxi Services',
    tagline: 'Chauffeured AC Sedans & SUVs with experienced local Konkan drivers',
    category: 'Chauffeured Transfers',
    color: '#0284C7',
    icon: '🚖',
    startingPrice: 'From ₹1,800 / day',
    rating: '4.9',
    reviewCount: '210+',
    overview:
      'Safe, punctual, and reliable cab services for airport transfers, railway station pick & drop, Jog Falls day tours, Gokarna beach hopping, and Murudeshwar pilgrimage. All vehicles are air-conditioned, commercially insured, and driven by courteous native drivers who know every scenic detour.',
    trustBadges: [
      { title: 'Zero Surge Guarantee', desc: 'Flat, transparent pricing agreed before dispatch' },
      { title: 'Verified Local Drivers', desc: 'Native drivers with deep local route expertise' },
      { title: 'Sanitized Clean Fleet', desc: 'Spotless AC sedans and spacious 7-seater SUVs' },
      { title: 'Doorstep Pickup', desc: 'Pickups at hotels, homestays, or station platform' },
    ],
    packages: [
      {
        name: 'Sedan (Dzire / Etios)',
        modelsOrDetails: 'AC 4-Passenger Sedan with large luggage boot',
        rate: '₹1,800 - ₹2,400 / day',
        idealFor: 'Couples and small families visiting Murudeshwar, Gokarna or Jog Falls',
      },
      {
        name: 'SUV (Ertiga / Innova)',
        modelsOrDetails: 'AC 6-7 Passenger MUV with overhead luggage rack',
        rate: '₹2,800 - ₹4,200 / day',
        idealFor: 'Groups and families with heavy baggage arriving at Honnavar station',
      },
    ],
    inclusions: [
      'Chauffeured air-conditioned vehicle',
      'Fuel charges for agreed route itinerary',
      'Driver allowances and toll clearances',
      'Luggage loading and unloading assistance',
    ],
    exclusions: [
      'Extra sightseeing spots outside agreed package route',
      'State border permits (for Goa / Maharashtra entries)',
    ],
    faqs: [
      {
        q: 'Do your drivers speak English and Hindi?',
        a: 'Yes, all drivers speak Kannada, Hindi, and practical English, and are happy to recommend local Konkan food stops.',
      },
    ],
  },

  boating: {
    id: 'boating',
    slug: 'boating',
    serviceType: 'boating',
    title: 'Sharavathi Backwater Boating & Mangrove Cruises',
    shortTitle: 'Backwater Boating',
    tagline: 'Serene mangrove cruises, island visits & mesmerizing Arabian sunset tours',
    category: 'River Expeditions',
    color: '#0D9488',
    icon: '⛵',
    startingPrice: 'From ₹400 / person',
    rating: '5.0',
    reviewCount: '450+',
    overview:
      'Experience the untouched biodiversity of the Sharavathi river basin. Glide through ancient mangrove tunnels, visit secluded river islands, and witness the golden sunset where the backwaters meet the Arabian Sea. Operated by licensed local boatmen with top-grade safety gear.',
    trustBadges: [
      { title: 'Govt. Certified Life Jackets', desc: 'Mandatory buoyant safety jackets for every guest' },
      { title: 'Experienced Boatmen', desc: 'Native fishermen with generational water knowledge' },
      { title: 'Child & Senior Friendly', desc: 'Gentle, calm waters with shaded boat canopies' },
      { title: 'Eco-Tour Certified', desc: 'Strict zero-plastic & wildlife conservation protocols' },
    ],
    packages: [
      {
        name: 'Mangrove Safari Cruise',
        modelsOrDetails: '1-Hour guided backwater cruise through lush mangrove trails',
        rate: '₹400 / person',
        idealFor: 'Nature lovers, birdwatchers & serene morning photography',
      },
      {
        name: 'Sunset Arabian Estuary Tour',
        modelsOrDetails: '1.5-Hour expedition to the Sharavathi river mouth & beach confluence',
        rate: '₹600 / person',
        idealFor: 'Couples & families seeking sunset view over the Arabian Sea',
      },
      {
        name: 'Private Island Charter',
        modelsOrDetails: 'Exclusive boat charter for up to 10 guests with island stopover',
        rate: '₹3,200 / boat',
        idealFor: 'Private groups, family reunions & romantic celebrations',
      },
    ],
    inclusions: [
      'Coast Guard approved life jackets for all ages',
      'Experienced boat pilot and local nature commentary',
      'Port boarding taxes and life safety clearances',
    ],
    exclusions: [
      'Special photography equipment permits (if commercial)',
      'Personal snacks and bottled refreshments',
    ],
    faqs: [
      {
        q: 'Is backwater boating safe for non-swimmers and kids?',
        a: 'Absolutely. Sharavathi backwaters are calm and free of ocean swells. High-buoyancy life jackets are compulsory for everyone on board.',
      },
    ],
  },

  scuba: {
    id: 'scuba',
    slug: 'scuba',
    serviceType: 'scuba',
    title: 'Netrani Island Scuba Diving & Water Sports',
    shortTitle: 'Scuba Diving & Watersports',
    tagline: 'PADI certified crystal-clear island diving & Arabian Sea water thrills',
    category: 'Marine Adventure',
    color: '#6366F1',
    icon: '🤿',
    startingPrice: 'From ₹3,500 / dive',
    rating: '4.9',
    reviewCount: '180+',
    overview:
      'Netrani Island (Pigeon Island), off Murudeshwar, is Karnataka’s premier diving paradise. Swim among coral reefs, sea turtles, stingrays, and vibrant schools of reef fish with 15–30m underwater visibility. Includes boat transfer from Murudeshwar harbor, certified dive masters, and complimentary GoPro video footage.',
    trustBadges: [
      { title: 'PADI Certified Instructors', desc: '1:1 in-water guidance for complete beginners' },
      { title: 'Free HD GoPro Video', desc: 'Professional underwater photography & video clips included' },
      { title: 'Speedboat Island Transfer', desc: 'Comfortable 70-minute speedboat cruise to Netrani' },
      { title: 'No Swimming Required', desc: 'First-time non-swimmer discovery dives fully accommodated' },
    ],
    packages: [
      {
        name: 'Discover Scuba (Beginner)',
        modelsOrDetails: '30-Min guided dive at Netrani with shallow-water training',
        rate: '₹3,500 / person',
        idealFor: 'First-timers, non-swimmers & adventurous travelers',
      },
      {
        name: 'Scuba + 5-in-1 Water Sports Combo',
        modelsOrDetails: 'Netrani Dive + Jet Ski, Banana Ride, Bumper & Parasailing',
        rate: '₹5,200 / person',
        idealFor: 'Full-day adrenaline rush on the Murudeshwar coast',
      },
    ],
    inclusions: [
      'All Scuba gear: wetsuit, BCD, regulator, mask, fins',
      'Speedboat transfer to Netrani Island and return',
      'Complimentary underwater GoPro HD photos and videos',
      'Light refreshments, fruit snacks, and drinking water',
    ],
    exclusions: [
      'Hotel pickup in Honnavar (optional cab add-on available)',
      'Meals post-activity in Murudeshwar town',
    ],
    faqs: [
      {
        q: 'Do I need swimming skills to dive at Netrani?',
        a: 'No! Discover Scuba Diving is tailored specifically for non-swimmers. A PADI dive master holds and guides you underwater for the entire dive.',
      },
    ],
  },

  homestay: {
    id: 'homestay',
    slug: 'homestay',
    serviceType: 'homestay',
    title: 'Riverside Homestays & Coastal Stays in Honnavar',
    shortTitle: 'Riverside Homestays',
    tagline: 'Authentic coastal hospitality, riverside cottages & traditional cuisine',
    category: 'Authentic Lodging',
    color: '#EC4899',
    icon: '🏡',
    startingPrice: 'From ₹1,500 / night',
    rating: '4.8',
    reviewCount: '190+',
    overview:
      'Immerse yourself in authentic coastal life with our verified homestay partners. Wake up to the sound of backwater currents and birdsong, savor authentic home-cooked Konkan and Malnad vegetarian or seafood meals, and enjoy warm hospitality that hotels simply cannot match.',
    trustBadges: [
      { title: 'Verified Safety & Hygiene', desc: 'Personal physical inspection and background-vetted hosts' },
      { title: 'Homecooked Konkan Feasts', desc: 'Authentic coastal breakfasts, fish curry & vegetarian thalis' },
      { title: 'Riverside & Beachside', desc: 'Unobstructed scenic waterfront locations in Honnavar' },
      { title: 'High-Speed Wi-Fi', desc: 'Dedicated workstations for coastal workations' },
    ],
    packages: [
      {
        name: 'Deluxe Riverside Room',
        modelsOrDetails: 'Private AC room with attached bath and river-facing balcony',
        rate: '₹1,500 - ₹2,200 / night',
        idealFor: 'Solo travelers, couples & remote workationers',
      },
      {
        name: 'Heritage Family Cottage',
        modelsOrDetails: 'Entire 2-Bedroom traditional villa with private garden & courtyard',
        rate: '₹3,800 - ₹5,500 / night',
        idealFor: 'Families & friend groups wanting complete privacy',
      },
    ],
    inclusions: [
      'Complimentary traditional coastal breakfast',
      'High-speed Wi-Fi & 24/7 hot water supply',
      'Private parking for two-wheelers and cars',
      'Local travel advice and hidden spot recommendations',
    ],
    exclusions: [
      'Lunch and dinner (available on prior host request)',
      'Personal laundry and specialty items',
    ],
    faqs: [
      {
        q: 'Is authentic local food available at the homestay?',
        a: 'Yes, our homestay hosts prepare fresh traditional Konkan meals upon request with local spices, fresh catch, and organic farm produce.',
      },
    ],
  },

  guide: {
    id: 'guide',
    slug: 'guide',
    serviceType: 'guide',
    title: 'Certified Local Tour Guides & Trekking Trails',
    shortTitle: 'Local Tour Guides',
    tagline: 'Uncover hidden waterfalls, coastal trails & historical lore with local insiders',
    category: 'Cultural & Nature Trails',
    color: '#8B5CF6',
    icon: '🧭',
    startingPrice: 'From ₹800 / tour',
    rating: '4.9',
    reviewCount: '140+',
    overview:
      'Skip the crowded tourist traps and discover the real Karnataka coast. Our certified local guides are native residents, storytellers, and naturalists who guide you through Mirjan Fort’s secret corridors, secluded cliff walks, and unmapped freshwater streams in Apsarakonda.',
    trustBadges: [
      { title: 'Native Knowledge', desc: 'Born and raised in Honnavar with deep cultural roots' },
      { title: 'Safety Trained', desc: 'First-aid certified for forest treks and hill trails' },
      { title: 'Flexible Timing', desc: 'Customizable morning, afternoon, or full-day itineraries' },
      { title: 'Hidden Gems Access', desc: 'Visit waterfalls and vistas absent from commercial maps' },
    ],
    packages: [
      {
        name: 'Mirjan Fort & Heritage Trail',
        modelsOrDetails: '2.5-Hour guided historical exploration of Queen Chennabhairadevi lore',
        rate: '₹800 / group',
        idealFor: 'History buffs, photography enthusiasts & families',
      },
      {
        name: 'Secret Waterfalls & Forest Trek',
        modelsOrDetails: 'Half-day nature trek through Western Ghat foothills and stream bathing',
        rate: '₹1,400 / group',
        idealFor: 'Adventure seekers, backpackers & nature lovers',
      },
    ],
    inclusions: [
      'Dedicated certified local guide for your group',
      'In-depth storytelling, botanical insights, and local history',
      'Assistance with local logistics and translation',
    ],
    exclusions: [
      'Entry monument fees (if applicable)',
      'Vehicle transport between trailheads',
    ],
    faqs: [
      {
        q: 'Can the guide accompany us on our rented bikes or cab?',
        a: 'Yes, guides can travel alongside your group on their own two-wheeler or join you in your chauffeured cab.',
      },
    ],
  },

  tours: {
    id: 'tours',
    slug: 'tours',
    serviceType: 'tours',
    title: 'All-in-One Coastal Karnataka Vacation Packages',
    shortTitle: 'Vacation Packages',
    tagline: 'Curated multi-day itineraries bundling bikes, boating, stays & island tours',
    category: 'Curated Itineraries',
    color: '#10B981',
    icon: '🎒',
    startingPrice: 'From ₹4,999 / package',
    rating: '5.0',
    reviewCount: '260+',
    overview:
      'Let GK WhizWheels handle your entire trip from start to finish. Our custom Karavali vacation packages seamlessly bundle two-wheeler or cab rental, riverside homestay accommodations, Sharavathi mangrove boat tours, Netrani scuba diving, and Jog Falls day excursions into a zero-stress holiday.',
    trustBadges: [
      { title: '10% Multi-Service Bundle Savings', desc: 'Guaranteed lower price than booking services individually' },
      { title: 'Dedicated Trip Coordinator', desc: 'Single point of contact via WhatsApp from arrival to departure' },
      { title: '100% Customizable', desc: 'Tailor days, vehicle choices, and activities to your pace' },
      { title: 'Flexible Rescheduling', desc: 'Free date changes up to 48 hours prior to arrival' },
    ],
    packages: [
      {
        name: '2D/1N Honnavar Weekend Gateway',
        modelsOrDetails: 'Bike Rental + Riverside Stay + Mangrove Cruise + Station Transfers',
        rate: '₹4,999 / couple',
        idealFor: 'Quick weekend escape from Bengaluru, Mumbai, or Pune',
      },
      {
        name: '3D/2N Coastal Explorer (Gokarna + Honnavar)',
        modelsOrDetails: 'Cruiser Bike + 2-Night Stay + Boating + Jog Falls day trip',
        rate: '₹8,499 / couple',
        idealFor: 'Comprehensive exploration of coastal highlights and mountain waterfalls',
      },
    ],
    inclusions: [
      'Selected vehicle rental (scooter, cruiser bike, or AC cab)',
      'Riverside homestay accommodation with daily breakfast',
      'Pre-booked boat cruise slots with life jacket passes',
      'Dedicated local travel coordinator on WhatsApp',
    ],
    exclusions: [
      'Train or flight tickets to Honnavar',
      'Personal shopping and discretionary meals',
    ],
    faqs: [
      {
        q: 'Can we customize the vacation package dates and inclusions?',
        a: 'Yes! All packages are fully modular. You can swap bikes for cabs, upgrade stays, or add scuba diving seamlessly.',
      },
    ],
  },
};

export const SERVICES_LIST: ServiceDefinition[] = Object.values(DEDICATED_SERVICES);
