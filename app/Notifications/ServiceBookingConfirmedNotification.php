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
        $branch = $this->serviceBooking->store;
        $serviceName = ucwords(str_replace('_', ' ', $this->serviceBooking->service_type));
        return [
            'name' => $branch?->name ? $branch->name.' '.$serviceName.' Desk' : 'GK WhizWheel '.$serviceName.' Desk',
            'phone' => $branch?->phone ?: '',
            'spot' => $this->serviceBooking->pickup_location ?: 'Meeting point to be confirmed by staff',
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
        $coordinatorInfo = $coord['phone'] !== ''
            ? "{$coord['name']} ({$coord['phone']})"
            : "{$coord['name']} — contact details pending verification";
        $voucherUrl = route('services.booking.confirmation', $this->serviceBooking->booking_number);
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
        $coordinatorInfo = $coord['phone'] !== ''
            ? "{$coord['name']} ({$coord['phone']})"
            : "{$coord['name']} — contact details pending verification";
        $voucherUrl = route('services.booking.confirmation', $this->serviceBooking->booking_number);
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
            ->line('Need assistance? Contact the booking branch or reply to this email for support.');
    }
}
