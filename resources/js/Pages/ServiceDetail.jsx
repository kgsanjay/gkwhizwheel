import React, { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Link } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';
import PageHead from '../Components/SEO/PageHead';
import ServiceBookingModal from '../Components/ServiceBookingModal';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    Paper,
    Divider,
    Breadcrumbs,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    MenuItem,
    InputAdornment,
} from '@mui/material';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import ScubaDivingIcon from '@mui/icons-material/Pool';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ExploreIcon from '@mui/icons-material/Explore';
import LuggageIcon from '@mui/icons-material/Luggage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SecurityIcon from '@mui/icons-material/Security';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShieldIcon from '@mui/icons-material/Shield';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DirectionsIcon from '@mui/icons-material/Directions';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import ServiceGalleryModal, { getServiceItemMedia } from '../Components/ServiceGalleryModal';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

// Complete dataset for all dedicated service landing pages
const DEDICATED_SERVICES = {
    'two-wheelers': {
        id: 'bikes',
        slug: 'bikes',
        title: 'Two-Wheeler & Scooter Rentals in Honnavar',
        tagline: 'Cruise Coastal NH66, Gokarna beaches & Jog Falls on your own terms',
        image: '/images/services/two_wheelers.jpg',
        category: 'Self-Drive Rentals',
        color: '#F59E0B',
        startingPrice: 'From ₹350 / day',
        rating: '5.0',
        reviewCount: '320+',
        overview:
            'GK WhizWheels is Honnavar’s largest and most trusted two-wheeler rental agency. We provide sanitized, regularly serviced cruiser motorcycles and gearless automatic scooters. With our dual hubs at Palya Main Road and right outside Honnavar Railway Station, you can step off your train and be on the open road in under two minutes.',
        trustBadges: [
            { title: 'Zero Security Deposit', desc: 'Available on Aadhaar & round-trip verification', icon: <ShieldIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'Station Platform 1 Delivery', desc: 'Bike waiting as soon as your train arrives', icon: <LocationOnIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
            { title: '2 Free Sanitized Helmets', desc: 'ISI helmets + phone mount & charger included', icon: <SportsMotorsportsIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
            { title: '24/7 Roadside Rescue', desc: 'On-call breakdown helpline across Uttara Kannada', icon: <PhoneIcon sx={{ color: '#7C3AED', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: 'DAILY RATE', val: 'Starts ₹350' },
            { label: 'STATION PICKUP', val: 'Platform 1 (5 Min)' },
            { label: 'SECURITY DEPOSIT', val: 'Zero Deposit' },
        ],
        quickPills: ['Honda Activa 6G', 'Classic 350', 'CB350', 'Electric EV'],
        destinationTag: 'HONNAVAR • GOKARNA • MURUDESHWAR • JOG FALLS',
        packages: [
            {
                name: 'Gearless Scooters',
                models: 'Honda Activa 6G, Suzuki Access 125, TVS Ntorq, Yamaha Fascino',
                rate: 'Starts ₹350 - ₹500 / day',
                idealFor: 'Eco Beach, Sharavathi backwaters & local Honnavar town sightseeing',
            },
            {
                name: 'Cruiser Motorcycles',
                models: 'Royal Enfield Classic 350, Honda H\'ness CB350',
                rate: 'Starts ₹1,000 - ₹1,400 / day',
                idealFor: 'Gokarna, Murudeshwar coastal highways & Jog Falls mountain ghats',
            },
            {
                name: 'Commuter Bikes',
                models: 'Honda Shine 125, Bajaj Pulsar 150',
                rate: 'Starts ₹500 - ₹700 / day',
                idealFor: 'High mileage, comfortable all-day exploring on rural Karnataka roads',
            },
            {
                name: 'Electric Scooters (EV)',
                models: 'Smart Electric Two-Wheelers with Portable Charger',
                rate: 'Starts ₹450 - ₹600 / day',
                idealFor: 'Eco-friendly quiet rides around Honnavar town & Sharavathi river',
            },
        ],
        inclusions: [
            '2 Sanitized ISI certified helmets',
            'Valid Commercial RC copy, Insurance & PUC',
            '24/7 Roadside breakdown support in Honnavar',
            'Mobile holder & charger adapter (available on request)',
            'Clean tank with sufficient petrol to reach nearest bunk',
        ],
        exclusions: [
            'Fuel consumed during your rental period',
            'Toll charges on NH66 (if applicable)',
            'Traffic violation fines incurred by rider',
        ],
        faqs: [
            {
                q: 'What documents do I need to rent a bike in Honnavar?',
                a: 'You need an original Government ID (Aadhaar Card or Passport) and a valid Indian Driving License (or International Driving Permit for foreign nationals).',
            },
            {
                q: 'Can I pick up the bike right outside Honnavar Railway Station?',
                a: 'Yes! We have an active station pickup hub. Simply let us know your arrival train timing and your ride will be waiting for you.',
            },
            {
                q: 'Is there a security deposit required?',
                a: 'We offer zero security deposit for verified tourists and passengers with valid round-trip tickets and government KYC.',
            },
        ],
        primaryCta: 'View Live Bike Catalog & Book',
        primaryHref: '/services/bikes',
    },
    'taxi': {
        id: 'taxi',
        slug: 'cabs',
        title: 'Coastal Cabs & AC Taxi Services in Honnavar',
        tagline: 'Reliable AC hatchbacks, sedans & 7-seater SUVs with courteous local chauffeurs',
        image: '/images/services/taxi.jpg',
        category: 'Private AC Chauffeurs',
        color: '#0284C7',
        startingPrice: 'From ₹12 / km',
        rating: '4.9',
        reviewCount: '180+',
        overview:
            'Whether arriving with family, traveling in a group, or planning an all-day excursion across Coastal Karnataka, GK WhizWheels provides well-maintained AC cabs with verified, courteous local chauffeurs who know every scenic shortcut and viewpoint.',
        trustBadges: [
            { title: 'Zero Surge Pricing', desc: 'Pre-fixed transparent rates with no hidden surge fees', icon: <ShieldIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
            { title: 'Station Platform 1 Pickup', desc: 'Driver waits with name board as your train arrives', icon: <LocationOnIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'Verified Chauffeurs', desc: 'Born & raised local drivers knowing every scenic shortcut', icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
            { title: 'Clean Chilled AC Cars', desc: 'Sanitized Dzire, Ertiga & Innova with bottled water', icon: <LocalTaxiIcon sx={{ color: '#8B5CF6', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: 'STATION TARIFF', val: 'Flat ₹300 - ₹600' },
            { label: 'OUTSTATION RATE', val: 'From ₹12 / Km' },
            { label: 'STATION PICKUP', val: '0-Min Punctual' },
        ],
        quickPills: ['Swift Dzire AC', 'Maruti Ertiga (7-Seater)', 'Toyota Innova Crysta', 'Airport Transfers'],
        destinationTag: 'HONNAVAR • GOKARNA • MURUDESHWAR • JOG FALLS • GOA AIRPORT',
        packages: [
            {
                name: 'Honnavar Railway Station Transfer',
                models: 'Dzire / Etios / Ertiga',
                rate: 'Flat ₹300 - ₹600',
                idealFor: 'Pickup from station to hotel, resort, or backwater jetty with zero waiting',
            },
            {
                name: 'Jog Falls Day Excursion',
                models: 'Sedan or 7-Seater SUV',
                rate: 'Starts ₹3,200 (Round Trip)',
                idealFor: 'Full day trip covering Jog Falls, Gerusoppa & Sharavathi valley vistas',
            },
            {
                name: 'Murudeshwar & Netrani Boat Jetty',
                models: 'Swift Dzire / Innova Crysta',
                rate: 'Starts ₹2,200 (Round Trip)',
                idealFor: 'Murudeshwar Shiva temple, beach & morning scuba boat jetty transfer',
            },
            {
                name: 'Gokarna Beach Circuit & Mirjan Fort',
                models: 'AC Sedan / SUV',
                rate: 'Starts ₹2,800 (Full Day)',
                idealFor: 'Om Beach, Kudle Beach, Mahabaleshwar Temple & Mirjan Fort heritage',
            },
            {
                name: 'Goa / Mangalore Airport Transfers',
                models: 'AC Sedan / 7-Seater SUV',
                rate: 'Starts ₹3,800 - ₹5,500',
                idealFor: 'Direct highway transfer to/from Dabolim, Mopa, or Mangalore airports',
            },
        ],
        inclusions: [
            'Air-conditioned well-maintained commercial vehicle',
            'Polite, experienced driver with deep local route knowledge',
            'Fuel charges and vehicle maintenance included',
            'Clean sanitized interior with bottled water and phone charging',
            'Punctual railway station platform exit pickup with name sign',
        ],
        exclusions: [
            'Parking and entry tickets at monuments/temples',
            'Driver night allowance (only if travel extends beyond 10:00 PM)',
            'Inter-state border permits (applicable only for Goa boundary)',
        ],
        faqs: [
            {
                q: 'How do I book a cab in advance?',
                a: 'You can click "Book Cab / Request Quote" or message our WhatsApp desk. We confirm vehicle assignment within 10 minutes.',
            },
            {
                q: 'Do you provide 7-seater vehicles for large families?',
                a: 'Yes! We have Maruti Ertiga and luxury Toyota Innova Crysta models with spacious legroom and generous luggage space.',
            },
            {
                q: 'Are drivers familiar with local sightseeing spots?',
                a: 'All our chauffeurs are born and raised in Uttara Kannada. They know the best crowd-free timings, authentic seafood stops, and scenic photo viewpoints.',
            },
        ],
        primaryCta: 'Book Cab / Request Instant Quote',
        primaryHref: null,
    },
    'boating': {
        id: 'boating',
        slug: 'boating',
        title: 'Sharavathi Backwater Boating & Mangrove Cruises',
        tagline: 'Glide through emerald mangrove tunnels, sunset estuaries & river islands',
        image: '/images/services/boating.jpg',
        category: 'River Backwater Cruise',
        color: '#059669',
        startingPrice: 'From ₹400 / person',
        rating: '5.0',
        reviewCount: '450+',
        overview:
            'The Sharavathi River backwaters in Honnavar are hailed as one of India’s most pristine eco-tourism wonders. Dense mangrove corridors, freshwater estuary channels, and gentle river tides create a tranquil haven. We partner with licensed, government-certified local boatmen to provide unforgettable morning and golden-hour sunset cruises.',
        trustBadges: [
            { title: '100% Certified Lifejackets', desc: 'Approved safety jackets for adults & children provided', icon: <ShieldIcon sx={{ color: '#059669', fontSize: 18 }} /> },
            { title: 'Govt Certified Captains', desc: 'Born-on-water native boatmen with decades of river mastery', icon: <DirectionsBoatIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
            { title: 'Golden Sunset Slot (4:30 PM)', desc: 'Unmissable Arabian Sea confluence golden-hour views', icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'Mavinkurve Island Halts', desc: 'Island exploration, photography & wooden bridge views', icon: <ExploreIcon sx={{ color: '#8B5CF6', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: 'CANAL CRUISE', val: '₹400 / Person' },
            { label: 'SUNSET ESTUARY', val: '₹500 / Person' },
            { label: 'PRIVATE CHARTER', val: '₹3,000 Flat' },
        ],
        quickPills: ['Mangrove Safari', 'Sunset Estuary Ride', 'Mavinkurve Island', 'Private Couple / Family Boat'],
        destinationTag: 'SHARAVATHI ESTUARY • MANGROVES • MAVINKURVE ISLAND • SEA CONFLUENCE',
        packages: [
            {
                name: 'Mangrove Canal Cruise (45 Mins)',
                models: 'Motorized Backwater Boat with Canopy',
                rate: '₹400 / Person',
                idealFor: 'Exploring thick mangrove bio-reserves & seeing exotic coastal birds',
            },
            {
                name: 'Sunset Estuary Ride (1 Hour)',
                models: 'Scenic Estuary Boat',
                rate: '₹500 / Person',
                idealFor: 'Golden hour confluence views where river meets the Arabian Sea',
            },
            {
                name: 'Mavinkurve Island Safari (1.5 Hours)',
                models: 'Island Hopping Motorboat',
                rate: '₹750 / Person',
                idealFor: 'Halts at peaceful river islands, scenic photography & wooden bridge views',
            },
            {
                name: 'Private Family / Couple Charter',
                models: 'Exclusive Private Boat (Up to 8-10 Pax)',
                rate: '₹3,000 Flat Rate',
                idealFor: 'Couples, private birthday celebrations, or family groups seeking privacy',
            },
        ],
        inclusions: [
            'Certified life jackets for every passenger (adults & kids)',
            'Experienced certified local boat captain & nature guide',
            'Entry permits & jetty boarding management included',
            'Estuary and mangrove photography halts at scenic viewpoints',
        ],
        exclusions: [
            'Snacks and personal beverages',
            'Ground transfer to jetty (available via our cab/bike rental)',
        ],
        faqs: [
            {
                q: 'What are the best hours for backwater boating?',
                a: 'The morning slot (7:00 AM – 9:30 AM) is ideal for tranquil birdwatching, while the sunset slot (4:45 PM – 6:30 PM) offers breathtaking golden light over the Arabian Sea confluence.',
            },
            {
                q: 'Is backwater boating safe for elderly people and young children?',
                a: 'Yes! Sharavathi backwaters are very calm and placid, with virtually zero ocean swells. Life jackets are mandatory and boats are stable, spacious, and covered.',
            },
            {
                q: 'Where is the boat boarding point in Honnavar?',
                a: 'The boarding jetty is conveniently located just 5 minutes from Honnavar town center. Exact GPS pin coordinates are sent instantly upon booking.',
            },
        ],
        primaryCta: 'Reserve Backwater Cruise Slot',
        primaryHref: null,
    },
    'scuba': {
        id: 'scuba',
        slug: 'scuba',
        title: 'Netrani Island Scuba Diving & Marine Expeditions',
        tagline: 'Explore vibrant coral reefs, sea turtles & schools of tropical fish with 1:1 PADI dive masters',
        image: '/images/services/scuba.jpg',
        category: 'PADI Scuba Expeditions',
        color: '#4F46E5',
        startingPrice: 'From ₹2,999 / dive',
        rating: '4.9',
        reviewCount: '210+',
        overview:
            'Located just off the coast near Murudeshwar, heart-shaped Netrani Island is Karnataka’s premier scuba diving and marine adventure destination. Dive into crystal-clear turquoise waters with PADI-certified dive masters. You don’t even need to know how to swim to experience this magical underwater world!',
        trustBadges: [
            { title: '1:1 PADI Dive Master', desc: 'Dedicated instructor holds you underwater throughout the dive', icon: <ShieldIcon sx={{ color: '#4F46E5', fontSize: 18 }} /> },
            { title: 'Free 4K GoPro Action Video', desc: 'High-res underwater video clips & photos included free', icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'Non-Swimmers 100% Welcome', desc: 'Zero swimming skills required for Discover Scuba Diving', icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
            { title: 'High-Speed Boat Cruise', desc: 'Scenic speedboat ride from Murudeshwar harbor to Netrani', icon: <DirectionsBoatIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: 'BEGINNER DIVE', val: '₹3,499 / Person' },
            { label: 'SNORKELING', val: '₹1,800 / Person' },
            { label: 'UNDERWATER 4K VIDEO', val: 'Free Included' },
        ],
        quickPills: ['Discover Scuba (Beginner)', 'Coral Snorkeling', 'PADI Certified 2-Dives', 'Watersports Combo'],
        destinationTag: 'NETRANI CORAL ISLAND • MURUDESHWAR HARBOR • ARABIAN SEA REEF',
        packages: [
            {
                name: 'Discover Scuba Diving (Beginners)',
                models: '1-on-1 PADI Instructor Guided Dive',
                rate: '₹3,499 / Person',
                idealFor: 'First-timers & non-swimmers. Includes training + 25-30 min underwater dive',
            },
            {
                name: 'Netrani Snorkeling Safari',
                models: 'Speedboat Trip + Snorkel Kit & Fins',
                rate: '₹1,800 / Person',
                idealFor: 'Surface coral reef viewing with life jacket and mask',
            },
            {
                name: 'Certified Diver Trip (2 Dives)',
                models: 'For PADI / SSI Open Water License Holders',
                rate: '₹4,500 / Person',
                idealFor: 'Deep reef navigation, pinnacle dives & cavern swim-throughs',
            },
            {
                name: 'Murudeshwar Watersports Combo',
                models: 'Scuba Diving + Jetski + Banana Ride',
                rate: '₹4,200 / Person',
                idealFor: 'Full day adrenaline adventure in Murudeshwar',
            },
        ],
        inclusions: [
            'Complete certified scuba diving equipment & wetsuit',
            '1-on-1 dedicated dive instructor for every individual',
            'Round-trip speedboat transfer from Murudeshwar jetty to Netrani',
            'Complimentary underwater HD action photos and video clips',
            'Snacks, fresh fruits, and hydration on board',
        ],
        exclusions: [
            'Personal swimwear (swimwear or tight polyester t-shirt required)',
            'Ground transfer from Honnavar to Murudeshwar (available via our cab/bike rental)',
        ],
        faqs: [
            {
                q: 'Do I need to know swimming to do scuba diving at Netrani?',
                a: 'No! Non-swimmers can easily enjoy the Discover Scuba Diving package. A dedicated PADI dive master holds you throughout the entire underwater dive.',
            },
            {
                q: 'What is the minimum age for scuba diving?',
                a: 'The minimum age is 10 years. All participants must fill out a standard PADI medical self-declaration questionnaire prior to boarding.',
            },
            {
                q: 'What marine life will I see at Netrani?',
                a: 'Netrani is home to butterflyfish, parrotfish, moray eels, sea turtles, stingrays, barracudas, and colorful coral gardens.',
            },
        ],
        primaryCta: 'Book Netrani Scuba Dive',
        primaryHref: null,
    },
    'homestay': {
        id: 'homestay',
        slug: 'homestays',
        title: 'Riverside & Beachside Coastal Homestays in Honnavar',
        tagline: 'Handpicked Karavali wooden cottages, riverfront villas & authentic coastal cuisine',
        image: '/images/services/homestay.jpg',
        category: 'Curated Coastal Stays',
        color: '#E11D48',
        startingPrice: 'From ₹1,200 / night',
        rating: '4.9',
        reviewCount: '195+',
        overview:
            'Skip generic cookie-cutter hotels and immerse yourself in genuine coastal Karnataka hospitality. We curate peaceful homestays along the Sharavathi riverfront, secluded coconut-grove beach villas near Eco Beach, and traditional heritage cottages with homemade Malnad and Karavali cuisine.',
        trustBadges: [
            { title: 'Verified Safe Properties', desc: 'Family-run, peaceful retreats away from highway noise', icon: <ShieldIcon sx={{ color: '#E11D48', fontSize: 18 }} /> },
            { title: 'Authentic Coastal Meals', desc: 'Homecooked vegetarian thalis & fresh Arabian Sea seafood', icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'High-Speed Wi-Fi & AC', desc: 'Work-from-nature ready with power backup & parking', icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
            { title: 'Sharavathi Riverfront Views', desc: 'Direct wooden deck access with sunset views over the water', icon: <HomeWorkIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: 'STARTING AT', val: '₹1,200 / Night' },
            { label: 'RIVERFRONT COTTAGE', val: 'From ₹1,800' },
            { label: 'HOME BREAKFAST', val: 'Free Included' },
        ],
        quickPills: ['Riverfront Wooden Cottage', 'Eco Beach Villa', 'Heritage Karavali Stay', 'Private Family Estate'],
        destinationTag: 'SHARAVATHI RIVERFRONT • ECO BEACH • HONNAVAR TOWN • SECLUDED GROVES',
        packages: [
            {
                name: 'Sharavathi Riverfront Wooden Cottage',
                models: 'AC Cottage with Riverview Balcony',
                rate: '₹1,800 - ₹2,800 / Night',
                idealFor: 'Couples and small families seeking peaceful sunset river views',
            },
            {
                name: 'Eco Beach Coconut Grove Villa',
                models: 'Beachside Villa with Garden Lawn',
                rate: '₹2,200 - ₹3,500 / Night',
                idealFor: 'Walking distance to Honnavar Eco Beach boardwalk & sunset beach',
            },
            {
                name: 'Backpacker Karavali Heritage Stay',
                models: 'Private Room with Traditional Verandah',
                rate: '₹1,200 - ₹1,600 / Night',
                idealFor: 'Solo travelers and budget explorers seeking authentic local living',
            },
            {
                name: 'Full Private Family Estate (8-12 Pax)',
                models: 'Exclusive Entire Villa with Kitchen',
                rate: '₹6,500 - ₹9,500 / Night',
                idealFor: 'Family reunions, group trips, and private barbecues',
            },
        ],
        inclusions: [
            'Fresh homemade traditional coastal breakfast',
            '24/7 Hot water & clean sanitized bed linens',
            'High-speed Wi-Fi internet & power backup',
            'Safe private parking for vehicles',
            'Direct access to friendly local hosts for travel tips',
        ],
        exclusions: [
            'Lunch and dinner (available on pre-order from home kitchen at reasonable rates)',
            'Special barbecue / campfire setup (available upon request)',
        ],
        faqs: [
            {
                q: 'What is the check-in and check-out timing?',
                a: 'Standard check-in is 12:00 PM and check-out is 11:00 AM. Flexible check-in is readily arranged if arriving on early morning Konkan trains.',
            },
            {
                q: 'Can vegetarian and non-vegetarian meals be arranged?',
                a: 'Yes! Our homestay kitchens prepare authentic coastal vegetarian dishes as well as fresh fish, prawns, and chicken curries on advance notice.',
            },
            {
                q: 'Are these homestays suitable for couples and families?',
                a: 'All our listed homestays are handpicked, fully verified family residences ensuring a safe, respectful, and peaceful environment.',
            },
        ],
        primaryCta: 'Book Homestay Room / Check Dates',
        primaryHref: null,
    },
    'guide': {
        id: 'guide',
        slug: 'guide',
        title: 'Local Travel Guides & Hidden Trail Companions',
        tagline: 'Discover secret jungle waterfalls, Mirjan Fort architecture & panoramic clifftops',
        image: '/images/services/guide.jpg',
        category: 'Local Expert Insiders',
        color: '#D97706',
        startingPrice: 'Custom / Free Itinerary',
        rating: '5.0',
        reviewCount: '160+',
        overview:
            'Honnavar and Uttara Kannada are packed with hidden gems that never appear on standard tourist maps. From secluded jungle cascades to 16th-century fortress walls and secret sunset cliffs, our local guides help you experience the real coastal Karnataka without wasting time in tourist traps.',
        trustBadges: [
            { title: 'Secret Off-Beat Spots', desc: 'Access hidden waterfalls & trails never found on tourist maps', icon: <ExploreIcon sx={{ color: '#D97706', fontSize: 18 }} /> },
            { title: 'Free Digital GPS Itinerary', desc: 'Pinpoint Google Maps route provided with every rental', icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'Multilingual Insiders', desc: 'Guides fluent in Kannada, English & Hindi born in Honnavar', icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
            { title: 'Safe Forest Trail Escort', desc: 'Dedicated safety companion for natural dipping pools & hikes', icon: <ShieldIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: 'DIGITAL GPS ROUTE', val: '100% Free' },
            { label: 'HALF-DAY GUIDE', val: '₹1,200 Flat' },
            { label: 'FULL-DAY COMPANION', val: '₹2,200 Flat' },
        ],
        quickPills: ['Free GPS Itinerary', 'Apsarakonda Secret Falls', 'Mirjan Fort Heritage', 'Full Day Coastal Safari'],
        destinationTag: 'APSARAKONDA FALLS • MIRJAN FORT • ECO BOARDWALK • SECRET JUNGLE CASCADES',
        packages: [
            {
                name: 'Complimentary GPS Itinerary',
                models: 'Curated Digital Route Map',
                rate: 'FREE with Any Rental',
                idealFor: 'Self-drive travelers wanting accurate turn-by-turn local recommendations',
            },
            {
                name: 'Half-Day Hidden Waterfalls Guide',
                models: 'Local Guide Companion (4 Hours)',
                rate: '₹1,200 Flat',
                idealFor: 'Safe forest trails, secluded waterfall dipping spots & natural pool photography',
            },
            {
                name: 'Heritage Fort & Temple Tour Guide',
                models: 'Historian / Local Guide (4 Hours)',
                rate: '₹1,500 Flat',
                idealFor: 'Mirjan Fort exploration, secret tunnels, architecture & photo stops',
            },
            {
                name: 'Full-Day Uttara Kannada Explorer',
                models: 'Dedicated Local Guide for Full Day',
                rate: '₹2,200 Flat',
                idealFor: 'Groups and families who want end-to-end guidance from morning till sunset',
            },
        ],
        inclusions: [
            'Fluent Kannada, English, and Hindi speaking local guide',
            'Secret vantage points for photography and drone filming',
            'Assistance with entry passes and local vendor negotiations',
            'Safety escort on forest and riverbank trails',
        ],
        exclusions: [
            'Guide transportation (guide rides with you or separate transport arranged)',
            'Personal meals and entry tickets to ticketed monuments',
        ],
        faqs: [
            {
                q: 'How does the free GPS itinerary work?',
                a: 'When you pick up your bike or cab, our staff shares our curated Google Maps list containing precise pinpoints for 25+ secret spots, fuel pumps, and eateries.',
            },
            {
                q: 'Can a guide accompany us on our bike or cab tour?',
                a: 'Yes! Our local guides can join you in your cab or lead the group on a separate two-wheeler.',
            },
        ],
        primaryCta: 'Request Local Travel Guide',
        primaryHref: null,
    },
    'tours': {
        id: 'tours',
        slug: 'tours',
        title: 'All-Inclusive Coastal Karnataka Vacation Packages',
        tagline: 'Complete holidays bundling Gokarna, Honnavar, Murudeshwar & Jog Falls with zero stress',
        image: '/images/services/tour.jpg',
        category: 'Multi-Day Holiday Circuits',
        color: '#7C3AED',
        startingPrice: 'Custom All-Inclusive',
        rating: '5.0',
        reviewCount: '130+',
        overview:
            'Planning a multi-day holiday in Coastal Karnataka? Let GK WhizWheels handle all the logistics. We bundle reliable transportation (cabs or self-drive bikes), verified riverside homestays, backwater boating passes, scuba bookings, and sightseeing into seamless, stress-free vacation itineraries.',
        trustBadges: [
            { title: 'Zero Logistics Stress', desc: 'Vehicles, stays, cruises & permits coordinated seamlessly', icon: <LuggageIcon sx={{ color: '#7C3AED', fontSize: 18 }} /> },
            { title: 'Save 10-15% on Bundles', desc: 'Package rates lower than booking each activity separately', icon: <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> },
            { title: 'Dedicated Trip Coordinator', desc: 'Single point of contact on WhatsApp from arrival to departure', icon: <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} /> },
            { title: 'Flexible Train Customization', desc: 'Itineraries adapted to your exact train arrival/departure', icon: <ShieldIcon sx={{ color: '#0284C7', fontSize: 18 }} /> },
        ],
        metricPillars: [
            { label: '2-DAY TRIP', val: 'From ₹2,499 / Pax' },
            { label: '3-DAY CIRCUIT', val: 'From ₹3,499 / Pax' },
            { label: 'COORDINATOR', val: '24/7 Dedicated' },
        ],
        quickPills: ['2-Day Honnavar & Murudeshwar', '3-Day Tri-City Circuit', '4-Day Ultimate Expedition', 'Custom Family Tour'],
        destinationTag: 'HONNAVAR • GOKARNA • MURUDESHWAR • JOG FALLS • YANA ROCKS',
        packages: [
            {
                name: '2-Day Honnavar & Murudeshwar Highlights',
                models: 'Cottage Stay + Boating + Rental Bike / Cab',
                rate: '₹2,499 / Person',
                idealFor: 'Weekend getaway from Bangalore, Hubli, or Goa',
            },
            {
                name: '3-Day Coastal Karnataka Tri-City Tour',
                models: 'Gokarna Beaches + Honnavar Mangroves + Murudeshwar Temple',
                rate: '₹3,499 / Person',
                idealFor: 'Comprehensive exploration of the coast with beach hopping',
            },
            {
                name: '4-Day Ultimate Uttara Kannada Expedition',
                models: 'Gokarna + Honnavar + Jog Falls + Yana Rocks + Netrani Scuba',
                rate: '₹5,499 / Person',
                idealFor: 'Full vacation combining mountain waterfalls, deep sea dive & river cruise',
            },
            {
                name: 'Custom Group / Family Package',
                models: 'Tailored to your dates, group size & budget',
                rate: 'Request Custom Quote',
                idealFor: 'Tailor-made itineraries with private villas & dedicated Tempo / Innova',
            },
        ],
        inclusions: [
            'Clean AC vehicle or self-drive bikes for the entire trip duration',
            'Handpicked verified riverside homestay or beachside resort accommodations',
            'Pre-booked Sharavathi backwater boat cruise tickets',
            '24/7 dedicated trip coordinator on WhatsApp and phone call',
        ],
        exclusions: [
            'Train or flight tickets to Honnavar / Gokarna',
            'Personal food expenses unless booked on MAP plan (breakfast + dinner)',
        ],
        faqs: [
            {
                q: 'Can itineraries be customized according to our arrival train?',
                a: 'Yes! We customize the itinerary to match your exact train timings at Honnavar, Gokarna, or Murudeshwar railway stations.',
            },
            {
                q: 'How far in advance should we book multi-day tours?',
                a: 'For weekend and holiday seasons (Oct to Feb), we recommend booking 1-2 weeks in advance to secure prime riverfront cottages.',
            },
        ],
        primaryCta: 'Plan My Multi-Day Vacation',
        primaryHref: null,
    },
};

// Aliases for slug matching
const SLUG_ALIASES = {
    'bikes': 'two-wheelers',
    'bike-rentals': 'two-wheelers',
    'scooters': 'two-wheelers',
    'cabs': 'taxi',
    'taxi-services': 'taxi',
    'cabs-service': 'taxi',
    'cab': 'taxi',
    'boat': 'boating',
    'boat-cruise': 'boating',
    'sharavathi-boating': 'boating',
    'scuba-diving': 'scuba',
    'netrani-scuba': 'scuba',
    'homestays': 'homestay',
    'stays': 'homestay',
    'guide-service': 'guide',
    'travel-guide': 'guide',
    'tour': 'tours',
    'packages': 'tours',
    'tour-packages': 'tours',
};

// Standard Distance Guide from Honnavar Hubs
const DESTINATION_DISTANCES = [
    { destination: 'Honnavar Railway Station', distance: '0 km', time: 'Direct Handover', mode: 'Bikes & Cabs Available' },
    { destination: 'Sharavathi River Boating Jetty', distance: '1.5 km', time: '5 Mins', mode: 'Scooter / Cab' },
    { destination: 'Honnavar Eco Beach & Boardwalk', distance: '4.2 km', time: '10 Mins', mode: 'Scooter / Bike' },
    { destination: 'Apsarakonda Falls & Marine Cliff', distance: '6.5 km', time: '15 Mins', mode: 'Scooter / Bike' },
    { destination: 'Historic Mirjan Fort', distance: '21 km', time: '25 Mins', mode: 'NH66 Coastal Highway' },
    { destination: 'Murudeshwar Shiva Temple & Beach', distance: '27 km', time: '35 Mins', mode: 'Direct Highway Cab / Bike' },
    { destination: 'Gokarna Om Beach & Mahabaleshwar', distance: '48 km', time: '55 Mins', mode: 'Scenic Coastal Ride' },
    { destination: 'Jog Falls (Highest Plunge Falls)', distance: '60 km', time: '1 Hr 20 Mins', mode: 'Ghat Highway Cab / Cruiser' },
];

export default function ServiceDetail({ slug = 'boating', availableItems = [] }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const normalizedSlug = useMemo(() => {
        const clean = (slug || '').toLowerCase();
        return SLUG_ALIASES[clean] || clean;
    }, [slug]);

    const service = DEDICATED_SERVICES[normalizedSlug] || DEDICATED_SERVICES['boating'];

    const [modalOpen, setModalOpen] = useState(false);
    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedItemForGallery, setSelectedItemForGallery] = useState(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenBooking = () => {
        setModalOpen(true);
    };

    // Text contrast tokens
    const primaryTextColor = isDark ? '#FFFFFF' : '#0F172A';
    const secondaryTextColor = isDark ? '#CBD5E1' : '#334155';
    const mutedTextColor = isDark ? '#94A3B8' : '#64748B';

    // Filter packages / DB items
    const filteredDbItems = useMemo(() => {
        if (!availableItems || availableItems.length === 0) return [];
        return availableItems.filter((item) => {
            const matchesCat = !selectedCategoryFilter || (item.category && item.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()));
            const matchesQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCat && matchesQuery;
        });
    }, [availableItems, selectedCategoryFilter, searchQuery]);

    const filteredPackages = useMemo(() => {
        if (!service.packages) return [];
        return service.packages.filter((pkg) => {
            const matchesCat = !selectedCategoryFilter || pkg.name.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) || pkg.models.toLowerCase().includes(selectedCategoryFilter.toLowerCase());
            const matchesQuery = !searchQuery || pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || pkg.idealFor.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesQuery;
        });
    }, [service.packages, selectedCategoryFilter, searchQuery]);

    const totalAvailableCount = availableItems && availableItems.length > 0 ? filteredDbItems.length : filteredPackages.length;

    const serviceFaqSchema = useMemo(() => {
        const visibleFaqs = (service.faqs || []).slice(0, 4).map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
            },
        }));

        visibleFaqs.push({
            '@type': 'Question',
            name: 'How far are popular Karavali sightseeing spots from Honnavar?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Honnavar is the central transit gateway of Uttara Kannada. Here are accurate road distances and typical travel times from our Honnavar Railway Station and town center hubs:',
            },
        });

        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: visibleFaqs,
        };
    }, [service.faqs]);

    return (
        <AppLayout>
            <PageHead
                title={`${service.title} | GK WhizWheel Honnavar`}
                description={`${service.tagline || service.overview || service.title}. Verified, reliable travel service in Honnavar.`}
                canonicalUrl={`https://whizwheels.in/services/${normalizedSlug}`}
                ogImage={service.image || '/images/logo.png'}
                ogType="website"
                structuredData={serviceFaqSchema}
            />

            {/* Accessibility Landmark */}
            <Box component="main" id="main-content" sx={{ width: '100%', overflowX: 'hidden' }}>
                {/* =========================================================================
                    1. MODERN 2-COLUMN HERO SECTION (Left Text + Right Showcase Card)
                ========================================================================== */}
                <Box
                    component="section"
                    aria-labelledby="service-hero-heading"
                    sx={{
                        width: '100%',
                        position: 'relative',
                        pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                        pb: { xs: 5, sm: 6, md: 7 },
                        px: { xs: 2, sm: 3.5, md: 5, lg: 6 },
                        background: isDark
                            ? 'radial-gradient(120% 120% at 85% 15%, #1E293B 0%, #0F172A 60%, #080D14 100%)'
                            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 55%, #EFF6FF 100%)',
                        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                    }}
                >
                    {/* Ambient Glows */}
                    <Box
                        aria-hidden="true"
                        sx={{
                            position: 'absolute',
                            top: -100,
                            right: -80,
                            width: 500,
                            height: 500,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${service.color}25 0%, transparent 70%)`,
                            pointerEvents: 'none',
                        }}
                    />
                    <Box
                        aria-hidden="true"
                        sx={{
                            position: 'absolute',
                            bottom: -100,
                            left: -80,
                            width: 450,
                            height: 450,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />

                    <Box sx={{ maxWidth: '1380px', mx: 'auto', width: '100%', position: 'relative', zIndex: 1 }}>
                        <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
                            {/* Left Column: Headline, Narrative, Value Props & CTAs */}
                            <Grid size={{ xs: 12, lg: 6.5 }}>
                                {/* Breadcrumbs & Live Badge */}
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                                    <Breadcrumbs
                                        aria-label="Breadcrumb navigation"
                                        sx={{ '& .MuiBreadcrumbs-separator': { color: secondaryTextColor } }}
                                    >
                                        <Typography
                                            component={Link}
                                            href="/"
                                            variant="caption"
                                            sx={{
                                                color: secondaryTextColor,
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                '&:hover': { color: service.color },
                                                '&:focus-visible': { outline: `2px solid ${service.color}`, borderRadius: 1 },
                                            }}
                                        >
                                            Home
                                        </Typography>
                                        <Typography
                                            component={Link}
                                            href="/services"
                                            variant="caption"
                                            sx={{
                                                color: secondaryTextColor,
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                '&:hover': { color: service.color },
                                            }}
                                        >
                                            Services
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            aria-current="page"
                                            sx={{ color: service.color, fontWeight: 800 }}
                                        >
                                            {service.title}
                                        </Typography>
                                    </Breadcrumbs>

                                    <Chip
                                        icon={<StarIcon aria-hidden="true" sx={{ fontSize: '0.9rem !important', color: '#F59E0B' }} />}
                                        label={`${service.rating} ★ Google Rated (${service.reviewCount} Reviews)`}
                                        size="small"
                                        sx={{
                                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                                            color: isDark ? '#FBBF24' : '#92400E',
                                            fontWeight: 800,
                                            fontSize: '0.74rem',
                                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                                        }}
                                    />
                                </Box>

                                {/* Modern Headline */}
                                <Typography
                                    id="service-hero-heading"
                                    variant="h1"
                                    component="h1"
                                    sx={{
                                        color: primaryTextColor,
                                        fontSize: { xs: '2.15rem', sm: '2.85rem', md: '3.4rem' },
                                        fontWeight: 950,
                                        lineHeight: { xs: 1.15, md: 1.1 },
                                        letterSpacing: '-0.035em',
                                        mb: 1.8,
                                    }}
                                >
                                    {service.title.includes(' in ') ? service.title.split(' in ')[0] : service.title}{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: `linear-gradient(90deg, ${service.color} 0%, #FBBF24 60%, #38BDF8 100%)`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        in Honnavar
                                    </Box>
                                </Typography>

                                {/* Subhead Narrative */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: secondaryTextColor,
                                        fontSize: { xs: '0.98rem', sm: '1.05rem', md: '1.1rem' },
                                        lineHeight: 1.65,
                                        mb: 3,
                                        maxWidth: 620,
                                        fontWeight: 500,
                                    }}
                                >
                                    {service.overview}
                                </Typography>

                                {/* 4 Modern Trust Features - Clean Frosted Badges */}
                                <Grid container spacing={1.5} sx={{ mb: 3.5, maxWidth: 640 }}>
                                    {service.trustBadges.map((item, idx) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.4,
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1.2,
                                                    borderRadius: 2.5,
                                                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
                                                    transition: 'border-color 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: service.color,
                                                    },
                                                }}
                                            >
                                                <Box sx={{ mt: 0.2, flexShrink: 0 }}>{item.icon}</Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.84rem', lineHeight: 1.2 }}>
                                                        {item.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.73rem', display: 'block', mt: 0.3, lineHeight: 1.3 }}>
                                                        {item.desc}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Action Buttons */}
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1.5 }}>
                                    {service.primaryHref ? (
                                        <Button
                                            component={Link}
                                            href={service.primaryHref}
                                            variant="contained"
                                            size="medium"
                                            endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                            sx={{
                                                fontWeight: 900,
                                                px: 3,
                                                py: 1.2,
                                                borderRadius: 2.5,
                                                fontSize: '0.92rem',
                                                bgcolor: service.color,
                                                color: '#0F172A',
                                                boxShadow: `0 8px 20px -4px ${service.color}50`,
                                                '&:hover': { filter: 'brightness(0.92)' },
                                            }}
                                        >
                                            {service.primaryCta}
                                        </Button>
                                    ) : (
                                        <Button
                                            component="a"
                                            href="#packages-section"
                                            variant="contained"
                                            size="medium"
                                            endIcon={<ArrowForwardIcon aria-hidden="true" />}
                                            sx={{
                                                fontWeight: 900,
                                                px: 3,
                                                py: 1.2,
                                                borderRadius: 2.5,
                                                fontSize: '0.92rem',
                                                bgcolor: service.color,
                                                color: '#FFFFFF',
                                                boxShadow: `0 8px 20px -4px ${service.color}50`,
                                                '&:hover': { filter: 'brightness(0.92)' },
                                            }}
                                        >
                                            Explore Packages & Rates ↓
                                        </Button>
                                    )}

                                    <Button
                                        component="a"
                                        href="tel:+918660989586"
                                        variant="outlined"
                                        size="medium"
                                        startIcon={<PhoneIcon sx={{ color: service.color }} />}
                                        sx={{
                                            fontWeight: 750,
                                            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                            color: isDark ? '#FFFFFF' : '#0F172A',
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': {
                                                borderColor: service.color,
                                                bgcolor: `${service.color}10`,
                                            },
                                        }}
                                    >
                                        Call 24/7 Desk
                                    </Button>

                                    <Button
                                        component="a"
                                        href={`https://wa.me/918660989586?text=Hi%20GK%20WhizWheels%2C%20I%20want%20to%20inquire%20or%20book%20${encodeURIComponent(service.title)}.`}
                                        target="_blank"
                                        rel="noreferrer"
                                        variant="contained"
                                        size="medium"
                                        startIcon={<WhatsAppIcon />}
                                        sx={{
                                            bgcolor: '#16A34A',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            px: 2.5,
                                            py: 1.2,
                                            borderRadius: 2.5,
                                            fontSize: '0.88rem',
                                            '&:hover': { bgcolor: '#15803D' },
                                        }}
                                    >
                                        WhatsApp
                                    </Button>
                                </Stack>
                            </Grid>

                            {/* Right Column: Modern High-End Service Showcase Card */}
                            <Grid size={{ xs: 12, lg: 5.5 }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: 'relative',
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                                        backdropFilter: 'blur(20px)',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                                        boxShadow: isDark
                                            ? '0 25px 50px -12px rgba(0,0,0,0.65)'
                                            : '0 20px 45px -10px rgba(15, 23, 42, 0.08)',
                                    }}
                                >
                                    {/* Top Card Header */}
                                    <Box
                                        sx={{
                                            px: 2.5,
                                            py: 1.5,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOnIcon sx={{ fontSize: 18, color: service.color }} />
                                            <Typography variant="caption" sx={{ fontWeight: 850, letterSpacing: '0.06em', color: primaryTextColor, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                                Honnavar Verified Experience
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={service.startingPrice}
                                            size="small"
                                            sx={{
                                                bgcolor: service.color,
                                                color: '#FFFFFF',
                                                fontWeight: 900,
                                                fontSize: '0.75rem',
                                                height: 24,
                                            }}
                                        />
                                    </Box>

                                    {/* Cinematic Image Showcase */}
                                    <Box sx={{ position: 'relative', height: { xs: 240, sm: 280 } }}>
                                        <Box
                                            component="img"
                                            src={service.image}
                                            alt={`${service.title} - ${service.tagline || 'Honnavar travel and rental service by GK WhizWheel'}`}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                p: 2,
                                            }}
                                        >
                                            {/* Top Overlay Badges */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip
                                                    label={service.category}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                        border: `1px solid ${service.color}80`,
                                                    }}
                                                />
                                                <Chip
                                                    icon={<StarIcon sx={{ color: '#F59E0B !important', fontSize: 13 }} />}
                                                    label={`${service.rating} ★ Verified`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#FFFFFF',
                                                        fontWeight: 700,
                                                        fontSize: '0.72rem',
                                                        backdropFilter: 'blur(8px)',
                                                    }}
                                                />
                                            </Box>

                                            {/* Bottom Overlay Title */}
                                            <Box>
                                                <Typography variant="caption" sx={{ color: service.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', display: 'block' }}>
                                                    {service.destinationTag}
                                                </Typography>
                                                <Typography variant="h6" component="p" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1.25, mt: 0.3 }}>
                                                    {service.tagline}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* 3 Metric Pillars Under Image */}
                                    <Grid container sx={{ p: 1.2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0' }}>
                                        {service.metricPillars.map((stat, idx) => (
                                            <Grid key={idx} size={{ xs: 4 }} sx={{ textAlign: 'center', borderRight: idx < 2 ? (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0') : 'none', py: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: secondaryTextColor, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em', display: 'block' }}>
                                                    {stat.label}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: primaryTextColor, fontWeight: 900, fontSize: '0.78rem', mt: 0.2 }}>
                                                    {stat.val}
                                                </Typography>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Card Footer Features & Booking Action */}
                                    <Box sx={{ p: 2.2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                                            <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800, fontSize: '0.78rem' }}>
                                                Live Availability • Instant Customer Coordination
                                            </Typography>
                                        </Box>

                                        {/* Quick Option Pills */}
                                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.6, mb: 2 }}>
                                            {service.quickPills.map((pillName, mIdx) => (
                                                <Chip
                                                    key={mIdx}
                                                    label={pillName}
                                                    size="small"
                                                    onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === pillName ? '' : pillName)}
                                                    sx={{
                                                        fontSize: '0.72rem',
                                                        fontWeight: 750,
                                                        cursor: 'pointer',
                                                        bgcolor: selectedCategoryFilter === pillName ? service.color : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                                                        color: selectedCategoryFilter === pillName ? '#FFFFFF' : primaryTextColor,
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                                    }}
                                                />
                                            ))}
                                        </Stack>

                                        {/* Direct Booking CTA */}
                                        <Button
                                            onClick={handleOpenBooking}
                                            variant="contained"
                                            fullWidth
                                            startIcon={<WhatsAppIcon />}
                                            sx={{
                                                bgcolor: '#16A34A',
                                                color: '#FFFFFF',
                                                fontWeight: 850,
                                                py: 1.1,
                                                borderRadius: 2.2,
                                                fontSize: '0.88rem',
                                                '&:hover': { bgcolor: '#15803D' },
                                            }}
                                        >
                                            Quick Reserve via WhatsApp / Online Form
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                {/* =========================================================================
                    2. SEARCH & PACKAGE FILTER DOCK
                ========================================================================== */}
                <Box
                    id="packages-section"
                    sx={{
                        maxWidth: '1380px',
                        width: '100%',
                        mx: 'auto',
                        px: { xs: 2, sm: 3, md: 4 },
                        pt: { xs: 4, md: 5 },
                        pb: 2,
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h2" component="h2" sx={{ fontWeight: 900, color: primaryTextColor, fontSize: { xs: '1.75rem', sm: '2.2rem' }, mb: 1 }}>
                            Available Packages & Options
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                            Filter real-time tariffs, inclusions, and operational schedules from Honnavar.
                        </Typography>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, sm: 3 },
                            mb: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
                            backdropFilter: 'blur(20px)',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                            borderRadius: 3.5,
                            boxShadow: isDark ? '0 15px 35px rgba(0,0,0,0.35)' : '0 10px 30px rgba(15, 23, 42, 0.05)',
                        }}
                    >
                        {/* Category Quick Tabs */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FilterAltIcon sx={{ color: service.color, fontSize: 20 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 850, color: primaryTextColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                                    Filter Options & Packages:
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8 }}>
                                <Chip
                                    label={`All Options (${availableItems && availableItems.length > 0 ? availableItems.length : service.packages.length})`}
                                    size="small"
                                    onClick={() => setSelectedCategoryFilter('')}
                                    sx={{
                                        fontWeight: 850,
                                        cursor: 'pointer',
                                        bgcolor: selectedCategoryFilter === '' ? service.color : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                                        color: selectedCategoryFilter === '' ? '#FFFFFF' : primaryTextColor,
                                        border: selectedCategoryFilter === '' ? `1px solid ${service.color}` : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'),
                                        '&:hover': { filter: 'brightness(0.95)' },
                                    }}
                                />
                                {service.quickPills.map((pill, pIdx) => {
                                    const isSelected = selectedCategoryFilter === pill;
                                    return (
                                        <Chip
                                            key={pIdx}
                                            label={pill}
                                            size="small"
                                            onClick={() => setSelectedCategoryFilter(isSelected ? '' : pill)}
                                            sx={{
                                                fontWeight: isSelected ? 850 : 700,
                                                cursor: 'pointer',
                                                bgcolor: isSelected ? service.color : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'),
                                                color: isSelected ? '#FFFFFF' : primaryTextColor,
                                                border: isSelected ? `1px solid ${service.color}` : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1'),
                                                '&:hover': { filter: 'brightness(0.95)' },
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        </Box>

                        {/* Search Input Bar */}
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={`Search in ${service.title} (e.g. models, destinations, timings)...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <FilterAltIcon sx={{ color: service.color, fontSize: 18 }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4, md: 3 }} sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<RestartAltIcon />}
                                    onClick={() => {
                                        setSelectedCategoryFilter('');
                                        setSearchQuery('');
                                    }}
                                    sx={{
                                        color: primaryTextColor,
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                        fontWeight: 750,
                                        height: 40,
                                        fontSize: '0.82rem',
                                        '&:hover': {
                                            borderColor: service.color,
                                            bgcolor: `${service.color}10`,
                                        },
                                    }}
                                >
                                    Reset Filters
                                </Button>
                            </Grid>
                        </Grid>

                        {/* Dock Footer */}
                        <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontWeight: 700, fontSize: '0.84rem' }}>
                                    Showing <Box component="span" sx={{ color: service.color, fontWeight: 900 }}>{totalAvailableCount}</Box> option(s) matching criteria
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: mutedTextColor, fontWeight: 600 }}>
                                Dual Hubs: Honnavar Railway Station (Platform 1 Exit) • Palya Main Road Head Office
                            </Typography>
                        </Box>
                    </Paper>

                    {/* =========================================================================
                        3. AVAILABLE PACKAGES & LIVE FLEET CATALOG
                    ========================================================================== */}
                    {availableItems && availableItems.length > 0 ? (
                        <Grid container spacing={3} sx={{ mb: 6 }}>
                            {filteredDbItems.map((item) => {
                                const media = getServiceItemMedia(item, service.image);
                                return (
                                <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 3.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                borderColor: service.color,
                                                boxShadow: `0 14px 28px -8px ${service.color}25`,
                                            },
                                        }}
                                    >
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    height: 190,
                                                    bgcolor: '#0F172A',
                                                    overflow: 'hidden',
                                                    cursor: media.hasMultiple ? 'pointer' : 'default',
                                                }}
                                                onClick={() => {
                                                    if (media.hasMultiple) {
                                                        setSelectedItemForGallery(item);
                                                        setGalleryModalOpen(true);
                                                    }
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={media.primary}
                                                    alt={`${item.name} - ${service.title} package in Honnavar`}
                                                    loading="lazy"
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                                {item.badge && (
                                                    <Chip
                                                        size="small"
                                                        label={item.badge}
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 12,
                                                            left: 12,
                                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                            color: '#FFFFFF',
                                                            fontWeight: 800,
                                                            backdropFilter: 'blur(8px)',
                                                            border: `1px solid ${service.color}80`,
                                                        }}
                                                    />
                                                )}
                                                {media.hasMultiple && (
                                                    <Chip
                                                        icon={<PhotoLibraryIcon sx={{ fontSize: '13px !important', color: '#FFFFFF !important' }} />}
                                                        label={`${media.count} Photos`}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 12,
                                                            right: 12,
                                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                            color: '#FFFFFF',
                                                            fontWeight: 800,
                                                            fontSize: '0.72rem',
                                                            backdropFilter: 'blur(8px)',
                                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        }}
                                                    />
                                                )}
                                                {item.capacity && (
                                                    <Chip
                                                        size="small"
                                                        label={item.capacity}
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 12,
                                                            right: 12,
                                                            bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                            color: '#FFFFFF',
                                                            fontWeight: 700,
                                                            fontSize: '0.72rem',
                                                            backdropFilter: 'blur(8px)',
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                        <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5, lineHeight: 1.3 }}>
                                                    {item.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: service.color, fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                    {item.category || service.category}
                                                </Typography>

                                                <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.84rem', lineHeight: 1.5, mb: 2 }}>
                                                    {item.description}
                                                </Typography>

                                                {item.features && Array.isArray(item.features) && item.features.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
                                                        {item.features.map((feat, fIdx) => (
                                                            <Chip
                                                                key={fIdx}
                                                                label={feat}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.7rem',
                                                                    height: 22,
                                                                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                                                    color: isDark ? '#CBD5E1' : '#475569',
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>

                                            <Box sx={{ pt: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', fontSize: '0.7rem' }}>
                                                            Standard Tariff
                                                        </Typography>
                                                        <Typography variant="h6" component="span" sx={{ fontWeight: 900, color: service.color, lineHeight: 1.1 }}>
                                                            ₹{Number(item.price_base).toLocaleString('en-IN')}
                                                            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.5 }}>
                                                                / {item.price_unit?.replace('per_', '')}
                                                            </Typography>
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    onClick={handleOpenBooking}
                                                    sx={{
                                                        bgcolor: service.color,
                                                        color: '#FFFFFF',
                                                        fontWeight: 800,
                                                        py: 1,
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        '&:hover': { filter: 'brightness(0.92)' },
                                                    }}
                                                >
                                                    Book This Option →
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                        </Grid>
                    ) : (
                        <Grid container spacing={3} sx={{ mb: 6 }}>
                            {filteredPackages.map((pkg, idx) => (
                                <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            p: 3,
                                            borderRadius: 3.5,
                                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                borderColor: service.color,
                                                boxShadow: `0 14px 28px -8px ${service.color}25`,
                                            },
                                        }}
                                    >
                                        <Box>
                                            <Chip
                                                label={pkg.rate}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${service.color}18`,
                                                    color: service.color,
                                                    fontWeight: 900,
                                                    fontSize: '0.78rem',
                                                    mb: 1.5,
                                                    border: `1px solid ${service.color}35`,
                                                }}
                                            />
                                            <Typography variant="h6" component="h3" sx={{ fontWeight: 850, color: isDark ? '#FFFFFF' : '#0F172A', mb: 1, lineHeight: 1.25 }}>
                                                {pkg.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: service.color, fontWeight: 750, display: 'block', mb: 1.5 }}>
                                                {pkg.models}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: secondaryTextColor, fontSize: '0.82rem', lineHeight: 1.5 }}>
                                                {pkg.idealFor}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 3, pt: 2, borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9' }}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                onClick={handleOpenBooking}
                                                sx={{
                                                    borderColor: service.color,
                                                    color: service.color,
                                                    fontWeight: 800,
                                                    borderRadius: 2,
                                                    py: 0.9,
                                                    '&:hover': { bgcolor: `${service.color}15`, borderColor: service.color },
                                                }}
                                            >
                                                Reserve Option
                                            </Button>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {/* =========================================================================
                        4. INCLUSIONS & POLICIES CHECKLIST
                    ========================================================================== */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h2" component="h2" sx={{ fontWeight: 900, color: primaryTextColor, fontSize: { xs: '1.75rem', sm: '2.2rem' }, mb: 1 }}>
                            Inclusions, Policies & Guidelines
                        </Typography>
                    </Box>
                    <Grid container spacing={3} sx={{ mb: 8 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F0FDF4',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        What's Included in {service.title}
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {service.inclusions.map((inc, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                                {inc}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Paper
                                sx={{
                                    p: 3.5,
                                    height: '100%',
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FEF2F2',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <SecurityIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                        Guidelines & Exclusions
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {service.exclusions.map((exc, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                                                {exc}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* =========================================================================
                        5. FREQUENTLY ASKED QUESTIONS ACCORDION
                    ========================================================================== */}
                    <Box sx={{ mb: 8 }}>
                        <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: primaryTextColor, mb: 1 }}>
                            Frequently Asked Questions
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 3 }}>
                            Everything you need to know about booking {service.title} in Honnavar.
                        </Typography>
                        <Stack spacing={1.5}>
                            {service.faqs.slice(0, 4).map((faq, fIdx) => (
                                <Accordion
                                    key={fIdx}
                                    sx={{
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                        borderRadius: '12px !important',
                                        '&:before': { display: 'none' },
                                        boxShadow: 'none',
                                    }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: service.color }} />}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                            {faq.q}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.7 }}>
                                            {faq.a}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}

                            {/* Collapsed Distance & Travel Time Guide Accordion */}
                            <Accordion
                                sx={{
                                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                                    borderRadius: '12px !important',
                                    '&:before': { display: 'none' },
                                    boxShadow: 'none',
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: service.color }} />}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: primaryTextColor }}>
                                        How far are popular Karavali sightseeing spots from Honnavar?
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2, lineHeight: 1.6 }}>
                                        Honnavar is the central transit gateway of Uttara Kannada. Here are accurate road distances and typical travel times from our Honnavar Railway Station and town center hubs:
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                        {DESTINATION_DISTANCES.map((item, dIdx) => (
                                            <Grid key={dIdx} size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryTextColor, fontSize: '0.84rem' }}>
                                                        {item.destination}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        <Chip
                                                            size="small"
                                                            label={item.distance}
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: '0.7rem',
                                                                bgcolor: `${service.color}15`,
                                                                color: service.color,
                                                                height: 22,
                                                            }}
                                                        />
                                                        <Typography variant="caption" sx={{ color: secondaryTextColor, fontWeight: 700 }}>
                                                            {item.time}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: mutedTextColor, display: 'block', mt: 0.5, fontSize: '0.72rem' }}>
                                                        {item.mode}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Stack>
                    </Box>

                    {/* =========================================================================
                        6. BOTTOM BOOKING CALLOUT BANNER
                    ========================================================================== */}
                    <Paper
                        sx={{
                            p: { xs: 3, md: 5 },
                            borderRadius: 4,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFBEB',
                            border: `1.5px solid ${service.color}50`,
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 3,
                            mb: 6,
                        }}
                    >
                        <Box>
                            <Chip label="24x7 HONNAVAR HUB ASSISTANCE" size="small" sx={{ bgcolor: service.color, color: '#FFFFFF', fontWeight: 900, mb: 1.5 }} />
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: primaryTextColor, mb: 1 }}>
                                Ready to Experience {service.title}?
                            </Typography>
                            <Typography variant="body1" sx={{ color: secondaryTextColor, maxWidth: 650 }}>
                                Connect instantly with our Honnavar station team. We confirm vehicle availability, boat slots, and homestay dates in minutes.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                variant="contained"
                                component="a"
                                href={`https://wa.me/918660989586?text=Hi%20GK%20WhizWheels,%20I%20want%20to%20book%20${encodeURIComponent(service.title)}.`}
                                target="_blank"
                                rel="noreferrer"
                                startIcon={<WhatsAppIcon />}
                                sx={{
                                    bgcolor: '#16A34A',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    px: 3.5,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#15803D' },
                                }}
                            >
                                WhatsApp Booking
                            </Button>
                            <Button
                                variant="outlined"
                                component={Link}
                                href="/services"
                                sx={{
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                                    color: primaryTextColor,
                                    fontWeight: 700,
                                    px: 3,
                                    py: 1.4,
                                    borderRadius: 2.5,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                All Services
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Universal Service Booking Modal */}
                    <ServiceBookingModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        initialServiceId={(service.slug === 'two-wheelers' || service.slug === 'bikes' || service.id === 'bikes' || service.id === 'two-wheelers') ? 'two_wheelers' : (service.id === 'tour' ? 'tours' : service.id)}
                        availableItems={availableItems}
                    />

                    {/* Multi-Image Service Gallery Modal */}
                    <ServiceGalleryModal
                        open={galleryModalOpen}
                        onClose={() => setGalleryModalOpen(false)}
                        title={selectedItemForGallery?.name || 'Photo Showcase'}
                        subtitle={selectedItemForGallery?.category || service.title}
                        images={selectedItemForGallery ? getServiceItemMedia(selectedItemForGallery, service.image).gallery : []}
                        tariff={selectedItemForGallery?.price_base ? `₹${Number(selectedItemForGallery.price_base).toLocaleString('en-IN')} / ${selectedItemForGallery.price_unit?.replace('per_', '') || ''}` : ''}
                        onBook={() => {
                            setGalleryModalOpen(false);
                            handleOpenBooking();
                        }}
                    />
                </Box>
            </Box>
        </AppLayout>
    );
}
