import React, { useState, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PageHead from '../../Components/SEO/PageHead';
import { PLACEHOLDER_IMAGES, getServicePlaceholder } from '../../utils/placeholder';

export default function BranchServiceLanding({
    branch = {},
    service = {},
    inventory = [],
    pickupPoints = [],
    otherBranches = [],
    availableServices = [],
    cabFareRules = [],
    cabVehicles = [],
    seo = {},
}) {
    const { siteSettings = {} } = usePage().props;

    // Default booking form state
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const [pickupDate, setPickupDate] = useState(today);
    const [returnDate, setReturnDate] = useState(tomorrow);
    const [pickupTime, setPickupTime] = useState('09:00');
    const [returnTime, setReturnTime] = useState('09:00');
    const [selectedPickupPointId, setSelectedPickupPointId] = useState(pickupPoints[0]?.id || '');
    const [selectedReturnPointId, setSelectedReturnPointId] = useState(pickupPoints[0]?.id || '');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Rental duration calculation
    const rentalDuration = useMemo(() => {
        try {
            const start = new Date(`${pickupDate}T${pickupTime}`);
            const end = new Date(`${returnDate}T${returnTime}`);
            const diffMs = end - start;
            if (diffMs <= 0) return { days: 1, label: '1 Day (Min)' };
            const hours = Math.ceil(diffMs / (1000 * 60 * 60));
            const days = Math.ceil(hours / 24);
            return {
                days: Math.max(1, days),
                hours,
                label: `${days} Day${days > 1 ? 's' : ''} (${hours} Hours)`,
            };
        } catch {
            return { days: 1, label: '1 Day' };
        }
    }, [pickupDate, returnDate, pickupTime, returnTime]);

    // Directional fee calculation
    const selectedPickupPoint = useMemo(
        () => pickupPoints.find((p) => p.id === Number(selectedPickupPointId)),
        [pickupPoints, selectedPickupPointId]
    );
    const selectedReturnPoint = useMemo(
        () => pickupPoints.find((p) => p.id === Number(selectedReturnPointId)),
        [pickupPoints, selectedReturnPointId]
    );

    const totalLocationFee = useMemo(() => {
        const pFee = Number(selectedPickupPoint?.delivery_fee || selectedPickupPoint?.pickup_fee || 0);
        const rFee = Number(selectedReturnPoint?.return_fee || 0);
        return pFee + rFee;
    }, [selectedPickupPoint, selectedReturnPoint]);

    // Filter inventory by category
    const filteredInventory = useMemo(() => {
        if (selectedCategory === 'all') return inventory;
        return inventory.filter(
            (item) => item.category_name?.toLowerCase() === selectedCategory.toLowerCase()
        );
    }, [inventory, selectedCategory]);

    const categories = useMemo(() => {
        const cats = new Set(inventory.map((i) => i.category_name).filter(Boolean));
        return ['all', ...Array.from(cats)];
    }, [inventory]);

    const scrollToInventory = () => {
        const el = document.getElementById('inventory-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSelectVehicle = (model) => {
        router.visit(
            `/services/bikes/models/${model.id}/${model.slug}?pickup_store_id=${branch.id}&return_store_id=${branch.id}&pickup_point_id=${selectedPickupPointId}&return_point_id=${selectedReturnPointId}&pickup_date=${pickupDate}&return_date=${returnDate}&pickup_time=${pickupTime}&return_time=${returnTime}`
        );
    };

    const whatsappConciergeUrl = `https://wa.me/91${(branch.whatsapp || siteSettings.whatsapp_number || '8660989586').replace(/\D/g, '')}?text=Hi%20GK%20WhizWheel%20${encodeURIComponent(branch.city || branch.name)}%20Hub,%20I%20would%20like%20to%20enquire%20about%20${encodeURIComponent(service.name)}%20for%20${pickupDate}.`;

    return (
        <AppLayout>
            <PageHead
                title={seo.title || `${service.name} in ${branch.city || branch.name} | GK WhizWheel`}
                description={seo.description || `Book verified ${service.name.toLowerCase()} in ${branch.city || branch.name}. 100% legal fleet, zero deposit options, and 24/7 coastal road rescue.`}
            />

            {/* Top Navigation & Sub-Branch Switcher Bar */}
            <section className="w-full bg-[var(--white)] border-b border-[var(--border)] py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center space-x-2 text-xs sm:text-sm text-[var(--text)] font-medium">
                        <Link href="/" className="hover:text-[var(--theme2)] cursor-pointer transition">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-[var(--header)] font-bold">{branch.city || branch.name}</span>
                        <span>/</span>
                        <span className="text-[var(--theme2)] font-semibold">{service.short_title || service.name}</span>
                    </nav>

                    {/* Branch Switcher Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--text)] whitespace-nowrap mr-1">
                            Switch Coastal Hub:
                        </span>
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-[var(--theme2)] text-[var(--white)] border border-[var(--theme2)] shadow-sm">
                            ● {branch.city || branch.name} (Active)
                        </span>
                        {otherBranches.map((other) => (
                            <Link
                                key={other.id}
                                href={`/${other.slug}/services/${service.slug}`}
                                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--light)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--theme2)] hover:text-[var(--theme2)] cursor-pointer transition whitespace-nowrap focus:ring-2 focus:ring-[var(--theme2)]"
                            >
                                {other.city || other.name} →
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Service Filter Tabs (Ivy League Tab Navigation) */}
            <section className="w-full bg-[var(--light)] border-b border-[var(--border)] px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto py-3">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--text)] whitespace-nowrap">
                        {branch.city || branch.name} Services:
                    </span>
                    {availableServices.filter((s) => s.is_enabled).map((s) => {
                        const isActive = s.slug === service.slug;
                        return (
                            <Link
                                key={s.slug}
                                href={`/${branch.slug}/services/${s.slug}`}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                                    isActive
                                        ? 'bg-[var(--white)] text-[var(--theme2)] border-[var(--theme2)] shadow-sm font-extrabold'
                                        : 'bg-transparent text-[var(--text)] border-transparent hover:border-[var(--border)] hover:bg-[var(--white)]'
                                } focus:ring-2 focus:ring-[var(--theme2)]`}
                            >
                                {s.name}
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* HERO SECTION: 2-Column Layout (7-Col SEO/Text Left, 5-Col Sticky Booking Widget Right) */}
            <section className="w-full bg-[var(--light)] py-12 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                    {/* Left Column (7 Columns): Authoritative Brand & SEO Context */}
                    <div className="lg:col-span-7 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase bg-[var(--white)] border border-[var(--border)] text-[var(--theme2)] mb-4 w-fit shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-[var(--theme)] animate-pulse" />
                            {branch.name} • {service.badge}
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--header)] tracking-tight leading-tight mb-4">
                            {service.headline} in{' '}
                            <span className="text-[var(--theme2)] underline decoration-[var(--theme)] decoration-4 underline-offset-8">
                                {branch.city || branch.name}
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg text-[var(--text)] font-normal leading-relaxed mb-8 max-w-2xl">
                            {service.subheadline}
                        </p>

                        {/* 4 Pillars of Operational Trust (Ivy League 2x2 Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-xl bg-[var(--white)] border border-[var(--border)]">
                                <div className="text-sm font-black text-[var(--header)] mb-1 flex items-center gap-2">
                                    <span className="text-[var(--theme2)] font-bold">✓</span> 100% Road-Legal Fleet
                                </div>
                                <div className="text-xs text-[var(--text)] leading-relaxed">
                                    Commercial yellow-board registration, valid comprehensive insurance, and physical RC onboard.
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--white)] border border-[var(--border)]">
                                <div className="text-sm font-black text-[var(--header)] mb-1 flex items-center gap-2">
                                    <span className="text-[var(--theme2)] font-bold">✓</span> Instant Digital KYC
                                </div>
                                <div className="text-xs text-[var(--text)] leading-relaxed">
                                    Zero security deposit options for verified riders. Complete verification in under 5 minutes online.
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--white)] border border-[var(--border)]">
                                <div className="text-sm font-black text-[var(--header)] mb-1 flex items-center gap-2">
                                    <span className="text-[var(--theme2)] font-bold">✓</span> Express Station Handover
                                </div>
                                <div className="text-xs text-[var(--text)] leading-relaxed">
                                    Platform-side delivery to Konkan Railway stations with directional one-way drop privileges.
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--white)] border border-[var(--border)]">
                                <div className="text-sm font-black text-[var(--header)] mb-1 flex items-center gap-2">
                                    <span className="text-[var(--theme2)] font-bold">✓</span> 24/7 Roadside Rescue
                                </div>
                                <div className="text-xs text-[var(--text)] leading-relaxed">
                                    Immediate mechanical support and backup vehicle dispatch across the Uttara Kannada coastal strip.
                                </div>
                            </div>
                        </div>

                        {/* Direct Hub Contact Strip */}
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[var(--text)] pt-2">
                            <span className="flex items-center gap-1.5">
                                <span className="text-[var(--theme2)] font-black">Desk:</span> {branch.phone}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-[var(--theme2)] font-black">Hours:</span> {branch.operating_hours_label}
                            </span>
                            <span>•</span>
                            <a
                                href={whatsappConciergeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--theme2)] hover:underline cursor-pointer font-extrabold focus:ring-2 focus:ring-[var(--theme2)]"
                            >
                                WhatsApp Concierge →
                            </a>
                        </div>
                    </div>

                    {/* Right Column (5 Columns): Sticky Ivy League Booking Widget */}
                    <div className="lg:col-span-5 sticky top-24">
                        <div className="bg-[var(--white)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xs">
                            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border)]">
                                <div>
                                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--theme2)]">
                                        Direct Reservation Desk
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--header)]">
                                        {branch.city || branch.name} Hub
                                    </h3>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-black bg-[var(--light)] text-[var(--header)] border border-[var(--border)]">
                                    {inventory.length} Options Ready
                                </span>
                            </div>

                            {/* Booking Widget Fields */}
                            {service.slug === 'bikes' ? (
                                <div className="space-y-4">
                                    {/* Pickup Point Selection */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--header)] mb-1.5">
                                            Pickup Location ({branch.city || branch.name})
                                        </label>
                                        <select
                                            value={selectedPickupPointId}
                                            onChange={(e) => setSelectedPickupPointId(e.target.value)}
                                            className="w-full h-12 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--white)] text-sm font-semibold text-[var(--header)] cursor-pointer focus:ring-2 focus:ring-[var(--theme2)] transition"
                                        >
                                            {pickupPoints.map((point) => (
                                                <option key={point.id} value={point.id}>
                                                    {point.name}{' '}
                                                    {Number(point.delivery_fee || point.pickup_fee || 0) > 0
                                                        ? `(+₹${Number(point.delivery_fee || point.pickup_fee).toLocaleString('en-IN')})`
                                                        : '(Free Hub Pickup)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Return Point Selection */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--header)] mb-1.5">
                                            Return Location
                                        </label>
                                        <select
                                            value={selectedReturnPointId}
                                            onChange={(e) => setSelectedReturnPointId(e.target.value)}
                                            className="w-full h-12 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--white)] text-sm font-semibold text-[var(--header)] cursor-pointer focus:ring-2 focus:ring-[var(--theme2)] transition"
                                        >
                                            {pickupPoints.map((point) => (
                                                <option key={point.id} value={point.id}>
                                                    {point.name}{' '}
                                                    {Number(point.return_fee || 0) > 0
                                                        ? `(+₹${Number(point.return_fee).toLocaleString('en-IN')})`
                                                        : '(Standard Return)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Dates Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--header)] mb-1">
                                                Pickup Date
                                            </label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={pickupDate}
                                                onChange={(e) => setPickupDate(e.target.value)}
                                                className="w-full h-12 px-3 rounded-xl border border-[var(--border)] bg-[var(--white)] text-xs sm:text-sm font-semibold text-[var(--header)] cursor-pointer focus:ring-2 focus:ring-[var(--theme2)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--header)] mb-1">
                                                Return Date
                                            </label>
                                            <input
                                                type="date"
                                                min={pickupDate || today}
                                                value={returnDate}
                                                onChange={(e) => setReturnDate(e.target.value)}
                                                className="w-full h-12 px-3 rounded-xl border border-[var(--border)] bg-[var(--white)] text-xs sm:text-sm font-semibold text-[var(--header)] cursor-pointer focus:ring-2 focus:ring-[var(--theme2)]"
                                            />
                                        </div>
                                    </div>

                                    {/* Times Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--header)] mb-1">
                                                Pickup Time
                                            </label>
                                            <input
                                                type="time"
                                                value={pickupTime}
                                                onChange={(e) => setPickupTime(e.target.value)}
                                                className="w-full h-12 px-3 rounded-xl border border-[var(--border)] bg-[var(--white)] text-xs sm:text-sm font-semibold text-[var(--header)] cursor-pointer focus:ring-2 focus:ring-[var(--theme2)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--header)] mb-1">
                                                Return Time
                                            </label>
                                            <input
                                                type="time"
                                                value={returnTime}
                                                onChange={(e) => setReturnTime(e.target.value)}
                                                className="w-full h-12 px-3 rounded-xl border border-[var(--border)] bg-[var(--white)] text-xs sm:text-sm font-semibold text-[var(--header)] cursor-pointer focus:ring-2 focus:ring-[var(--theme2)]"
                                            />
                                        </div>
                                    </div>

                                    {/* Calculated Duration & Directional Fee Preview */}
                                    <div className="p-3.5 rounded-xl bg-[var(--light)] border border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--text)]">
                                        <span>Duration: <strong className="text-[var(--header)]">{rentalDuration.label}</strong></span>
                                        {totalLocationFee > 0 && (
                                            <span className="text-[var(--theme2)]">
                                                Location Surcharge: +₹{totalLocationFee.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Action Button */}
                                    <button
                                        type="button"
                                        onClick={scrollToInventory}
                                        className="w-full h-12 rounded-xl font-black text-sm bg-[var(--theme)] text-[var(--theme2)] hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 focus:ring-2 focus:ring-[var(--theme2)] shadow-xs"
                                    >
                                        Browse Available Bikes ({filteredInventory.length}) ↓
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-[var(--text)] leading-relaxed">
                                        Coordinate verified reservations directly with our local {branch.city || branch.name} dispatch team. Fast-track approval with transparent pricing.
                                    </p>
                                    <div className="p-4 rounded-xl bg-[var(--light)] border border-[var(--border)] space-y-2 text-xs font-semibold text-[var(--text)]">
                                        <div className="flex justify-between">
                                            <span>Active Location:</span>
                                            <strong className="text-[var(--header)]">{branch.name}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Service:</span>
                                            <strong className="text-[var(--theme2)]">{service.name}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Starting Rate:</span>
                                            <strong className="text-[var(--theme2)] font-black">
                                                {inventory[0]?.price_base ? `From ₹${Number(inventory[0].price_base).toLocaleString('en-IN')}` : 'Check Live Tariff'}
                                            </strong>
                                        </div>
                                    </div>

                                    <a
                                        href={whatsappConciergeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full h-12 rounded-xl font-black text-sm bg-[var(--theme)] text-[var(--theme2)] hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 focus:ring-2 focus:ring-[var(--theme2)] shadow-xs"
                                    >
                                        Book via WhatsApp Concierge →
                                    </a>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--text)]">
                                Verified road-legal fleet • Zero hidden checkout fees
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* INVENTORY SECTION: 3-Column Grid Displaying Branch-Scoped Fleet / Items */}
            <section id="inventory-section" className="w-full bg-[var(--white)] py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 pb-6 border-b border-[var(--border)]">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--theme2)] block mb-1">
                                {branch.city || branch.name} Real-Time Inventory
                            </span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--header)] tracking-tight">
                                Available {service.short_title} at {branch.city || branch.name}
                            </h2>
                        </div>

                        {/* Category Filter Pills (if bikes) */}
                        {service.slug === 'bikes' && categories.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`h-12 min-h-[48px] px-5 rounded-xl text-xs font-bold capitalize transition cursor-pointer border flex items-center justify-center ${
                                            selectedCategory === cat
                                                ? 'bg-[var(--theme2)] text-[var(--white)] border-[var(--theme2)] shadow-xs font-extrabold'
                                                : 'bg-[var(--light)] text-[var(--text)] border-[var(--border)] hover:border-[var(--theme2)]'
                                        } focus:ring-2 focus:ring-[var(--theme2)]`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3-Column Grid */}
                    {filteredInventory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredInventory.map((item) => (
                                <article
                                    key={item.id}
                                    className="bg-[var(--white)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--theme2)] transition flex flex-col justify-between shadow-xs"
                                >
                                    {/* Card Image Area */}
                                    <div className="relative bg-[var(--light)] p-6 flex items-center justify-center min-h-[200px] border-b border-[var(--border)]">
                                        <img
                                            src={item.image_url || getServicePlaceholder(service.slug || service.short_title || 'bikes')}
                                            alt={item.name}
                                            className="max-h-40 max-w-full object-contain transition duration-300 hover:scale-105"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = getServicePlaceholder(service.slug || service.short_title || 'bikes');
                                            }}
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-[var(--white)] border border-[var(--border)] text-[var(--header)] shadow-2xs">
                                                {item.category_name || item.category || service.short_title}
                                            </span>
                                        </div>
                                        {item.available_now > 0 && (
                                            <div className="absolute top-3 right-3">
                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[var(--white)] text-[var(--theme2)] border border-[var(--border)] shadow-xs">
                                                    ● {item.available_now} Available
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content Area */}
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-[var(--text)] mb-1 uppercase tracking-wider">
                                                {item.brand || branch.city || branch.name}
                                            </div>
                                            <h3 className="text-xl font-black text-[var(--header)] mb-3">
                                                {item.name}
                                            </h3>

                                            {/* Feature Badges */}
                                            {service.slug === 'bikes' ? (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--light)] text-[var(--header)] border border-[var(--border)]">
                                                        {item.fuel_type}
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--light)] text-[var(--header)] border border-[var(--border)]">
                                                        {item.transmission}
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--light)] text-[var(--header)] border border-[var(--border)]">
                                                        2 ISI Helmets
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-[var(--text)] line-clamp-2 leading-relaxed mb-4">
                                                    {item.description || 'Verified package serviced directly by our licensed local coastal partners.'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Rate and Reserve Action */}
                                        <div className="pt-4 border-t border-[var(--border)]">
                                            <div className="flex items-baseline justify-between mb-4">
                                                <div>
                                                    <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text)]">
                                                        Weekday Tariff
                                                    </div>
                                                    <div className="text-2xl font-black text-[var(--theme2)]">
                                                        ₹{(item.weekday_rate || item.price_base || 0).toLocaleString('en-IN')}
                                                        <span className="text-xs font-bold text-[var(--text)] ml-1">
                                                            / {item.price_unit || 'day'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.weekend_rate && (
                                                    <div className="text-right">
                                                        <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text)]">
                                                            Weekend
                                                        </div>
                                                        <div className="text-sm font-bold text-[var(--header)]">
                                                            ₹{Number(item.weekend_rate).toLocaleString('en-IN')} / day
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {service.slug === 'bikes' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectVehicle(item)}
                                                    className="w-full h-12 rounded-xl font-bold text-sm bg-[var(--theme2)] text-[var(--white)] hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-[var(--theme2)] shadow-xs"
                                                >
                                                    Select {item.name} →
                                                </button>
                                            ) : (
                                                <a
                                                    href={whatsappConciergeUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full h-12 rounded-xl font-bold text-sm bg-[var(--theme2)] text-[var(--white)] hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-[var(--theme2)] shadow-xs"
                                                >
                                                    Reserve Package →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-4 bg-[var(--light)] rounded-2xl border border-[var(--border)] max-w-xl mx-auto">
                            <h3 className="text-lg font-black text-[var(--header)] mb-2">
                                All units currently reserved for these dates
                            </h3>
                            <p className="text-xs text-[var(--text)] mb-6">
                                Connect directly with our {branch.city || branch.name} dispatch counter to arrange express transit or backup allocations.
                            </p>
                            <a
                                href={whatsappConciergeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-6 h-12 rounded-xl font-black text-sm bg-[var(--theme)] text-[var(--theme2)] hover:opacity-95 cursor-pointer focus:ring-2 focus:ring-[var(--theme2)] shadow-xs"
                            >
                                WhatsApp Floor Manager
                            </a>
                        </div>
                    )}
                </div>
            </section>

            {/* DETAILS SECTION: 2-Column Layout (Pickup Points on Left, Inclusions & Rules Grid on Right) */}
            <section className="w-full bg-[var(--light)] py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column (6 Cols): Pickup Points List & Map Details */}
                    <div className="lg:col-span-6 space-y-6">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--theme2)] block mb-1">
                                {branch.city || branch.name} Handover Network
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-[var(--header)] tracking-tight">
                                Pickup Points & Directional Fees
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text)] font-normal mt-2 leading-relaxed">
                                Pick up directly at our primary branch counter or choose express delivery to transit points with transparent directional fees.
                            </p>
                        </div>

                        <div className="space-y-3.5">
                            {pickupPoints.map((point) => {
                                const deliveryFee = Number(point.delivery_fee || point.pickup_fee || 0);
                                const returnFee = Number(point.return_fee || 0);

                                return (
                                    <div
                                        key={point.id}
                                        className="p-5 rounded-2xl bg-[var(--white)] border border-[var(--border)] shadow-xs space-y-2 hover:border-[var(--theme2)] transition"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h4 className="text-base font-black text-[var(--header)]">
                                                    {point.name}
                                                </h4>
                                                <p className="text-xs text-[var(--text)] mt-0.5">
                                                    {point.address_line || point.landmark || branch.address_line}
                                                </p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                {deliveryFee > 0 ? (
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[var(--light)] text-[var(--theme2)] border border-[var(--border)]">
                                                        +₹{deliveryFee.toLocaleString('en-IN')} Delivery
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[var(--light)] text-[var(--theme2)] border border-[var(--border)]">
                                                        Free Hub Handover
                                                    </span>
                                                )}
                                                {returnFee > 0 && (
                                                    <span className="text-[10px] font-bold text-[var(--text)]">
                                                        Return Fee: +₹{returnFee.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {branch.google_maps_url && (
                            <a
                                href={branch.google_maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--theme2)] hover:underline cursor-pointer focus:ring-2 focus:ring-[var(--theme2)]"
                            >
                                View {branch.name} on Google Maps →
                            </a>
                        )}
                    </div>

                    {/* Right Column (6 Cols): Service Inclusions & Operational Rules */}
                    <div className="lg:col-span-6 space-y-8">
                        {/* 1. Inclusions Checklist */}
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--theme2)] block mb-1">
                                Transparent Commitments
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-[var(--header)] tracking-tight mb-4">
                                What's 100% Included
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {(service.inclusions || []).map((inc, i) => (
                                    <div
                                        key={i}
                                        className="p-4 rounded-xl bg-[var(--white)] border border-[var(--border)] space-y-1 shadow-xs"
                                    >
                                        <div className="text-xs font-black text-[var(--header)] flex items-center gap-1.5">
                                            <span className="text-[var(--theme2)] font-bold">✓</span>
                                            {inc.title}
                                        </div>
                                        <p className="text-[11px] text-[var(--text)] leading-relaxed">
                                            {inc.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Operational Rules & Compliance List */}
                        <div className="p-6 rounded-2xl bg-[var(--white)] border border-[var(--border)] shadow-xs">
                            <h3 className="text-base font-black text-[var(--header)] mb-3 flex items-center gap-2">
                                Important Rider Compliance Rules
                            </h3>
                            <ul className="space-y-2.5 text-xs text-[var(--text)] leading-relaxed">
                                {(service.rules || []).map((rule, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-[var(--theme2)] font-black leading-none mt-0.5">•</span>
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
