<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ServiceBooking;
use App\Notifications\Concerns\LogsNotification;
use App\Notifications\Messages\WhatsAppMessage;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ServiceBookingConfirmedNotification extends Notification
{
    use LogsNotification;
    use Queueable;

    public const SERVICE_COORDINATORS = [
        'two_wheelers' => [
            'name' => 'WhizWheel Fleet Desk',
            'phone' => '+91 94815 12340',
            'spot' => 'Palya Main Rd Hub, Honnavar (14.2810° N, 74.4442° E)',
        ],
        'taxi' => [
            'name' => 'WhizWheel Taxi Dispatch',
            'phone' => '+91 94815 12341',
            'spot' => 'Honnavar Railway Station / Pickup Location',
        ],
        'boating' => [
            'name' => 'Captain Boating Desk',
            'phone' => '+91 94815 12342',
            'spot' => 'Sharavathi Boating Jetty, Mavinkurve, Honnavar (14.2755° N, 74.4312° E)',
        ],
        'scuba' => [
            'name' => 'Netrani Dive Master Desk',
            'phone' => '+91 94815 12343',
            'spot' => 'Murudeshwar Main Beach / Netrani Boarding Point (14.0940° N, 74.4849° E)',
        ],
        'homestay' => [
            'name' => 'Coastal Homestay Reception',
            'phone' => '+91 94815 12344',
            'spot' => 'Coastal Homestay Reception, Apsarakonda Rd, Honnavar',
        ],
        'guide' => [
            'name' => 'Lead Explorer / Guide Desk',
            'phone' => '+91 94815 12345',
            'spot' => 'Honnavar Tourist Information Centre / Pickup Point',
        ],
        'tours' => [
            'name' => 'Tour Operations Desk',
            'phone' => '+91 94815 12346',
            'spot' => 'GK WhizWheel Tour Operations Desk, Honnavar',
        ],
    ];

    public function __construct(
        public readonly ServiceBooking $serviceBooking
    ) {
    }

    public function template(): string
    {
        return 'service_booking_confirmed';
    }

    public function serviceBookingId(): ?int
    {
        return (int) $this->serviceBooking->id;
    }

    /**
     * Get coordinator details for this service booking.
     *
     * @return array{name: string, phone: string, spot: string}
     */
    public function getCoordinatorDetails(): array
    {
        $serviceType = $this->serviceBooking->service_type;

        return self::SERVICE_COORDINATORS[$serviceType] ?? [
            'name' => 'GK WhizWheel Operations',
            'phone' => '+91 94815 12340',
            'spot' => 'Honnavar Operations Hub',
        ];
    }

    /**
     * Get the WhatsApp representation of the notification.
     */
    public function toWhatsApp(object $notifiable): WhatsAppMessage
    {
        $coord = $this->getCoordinatorDetails();
        $itemName = $this->serviceBooking->serviceItem?->name ?? ucfirst(str_replace('_', ' ', $this->serviceBooking->service_type));
        $meetingSpot = $this->serviceBooking->pickup_location ?: $coord['spot'];
        $coordinatorInfo = "{$coord['name']} ({$coord['phone']})";
        $voucherUrl = url("/services/booking/confirmation/{$this->serviceBooking->booking_number}");
        $customerName = $notifiable->name ?? $this->serviceBooking->customer_name ?? 'Valued Customer';

        return WhatsAppMessage::create('service_booking_confirmed')
            ->parameters([
                $customerName,
                $this->serviceBooking->booking_number,
                $itemName,
                $meetingSpot,
                $coordinatorInfo,
                '₹'.number_format((float) $this->serviceBooking->total_amount, 2),
            ])
            ->buttonUrl($voucherUrl);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $coord = $this->getCoordinatorDetails();
        $itemName = $this->serviceBooking->serviceItem?->name ?? ucfirst(str_replace('_', ' ', $this->serviceBooking->service_type));
        $meetingSpot = $this->serviceBooking->pickup_location ?: $coord['spot'];
        $coordinatorInfo = "{$coord['name']} ({$coord['phone']})";
        $voucherUrl = url("/services/booking/confirmation/{$this->serviceBooking->booking_number}");
        $customerName = $notifiable->name ?? $this->serviceBooking->customer_name ?? 'Valued Customer';
        $startDate = $this->serviceBooking->start_datetime ? Carbon::parse($this->serviceBooking->start_datetime)->toFormattedDateString() : '';

        $mail = (new MailMessage())
            ->subject("Service Booking Confirmed - {$this->serviceBooking->booking_number}")
            ->greeting("Hello {$customerName},")
            ->line("Your booking for {$itemName} has been confirmed successfully!")
            ->line("Booking Reference: {$this->serviceBooking->booking_number}")
            ->line("Scheduled Date: {$startDate}")
            ->line("Meeting Point / Spot: {$meetingSpot}")
            ->line("Service Coordinator: {$coordinatorInfo}")
            ->line('Total Amount: ₹'.number_format((float) $this->serviceBooking->total_amount, 2))
            ->line('Advance Paid: ₹'.number_format((float) $this->serviceBooking->advance_paid, 2));

        if ((float) $this->serviceBooking->balance_due > 0) {
            $mail->line('Balance Due: ₹'.number_format((float) $this->serviceBooking->balance_due, 2).' (Payable at desk or online via voucher)');
        }

        return $mail->action('View Digital Voucher', $voucherUrl)
            ->line('Need assistance? Feel free to reach out directly to your service coordinator or visit our desk at Honnavar.');
    }
}
