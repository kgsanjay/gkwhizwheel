<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\NotificationLog;
use App\Notifications\BookingConfirmationNotification;
use App\Notifications\ServiceBookingConfirmedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminLogWebController extends Controller
{
    /**
     * Display the unified system logs and alerts viewer (SuperAdmin only).
     */
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403, 'Unauthorized.');

        $activeTab = $request->input('tab', 'notifications');

        $notifications = null;
        $activities = null;

        if ($activeTab === 'activity') {
            $activityQuery = ActivityLog::with(['user', 'store'])
                ->latest('id');

            if ($search = $request->input('search')) {
                $activityQuery->where(function ($q) use ($search): void {
                    $q->where('action', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search): void {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            if ($action = $request->input('action')) {
                $activityQuery->where('action', $action);
            }

            $activities = $activityQuery->paginate(20)->withQueryString();
        } else {
            $notifQuery = NotificationLog::with(['user', 'booking', 'serviceBooking'])
                ->latest('id');

            if ($search = $request->input('search')) {
                $notifQuery->where(function ($q) use ($search): void {
                    $q->where('template', 'like', "%{$search}%")
                        ->orWhere('error_message', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search): void {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('booking', function ($bq) use ($search): void {
                            $bq->where('booking_reference', 'like', "%{$search}%");
                        })
                        ->orWhereHas('serviceBooking', function ($sbq) use ($search): void {
                            $sbq->where('booking_number', 'like', "%{$search}%");
                        });
                });
            }

            if ($channel = $request->input('channel')) {
                $notifQuery->where('channel', $channel);
            }

            if ($status = $request->input('status')) {
                $notifQuery->where('status', $status);
            }

            $notifications = $notifQuery->paginate(20)->withQueryString();
        }

        return Inertia::render('Admin/Logs/Index', [
            'activeTab' => $activeTab,
            'notifications' => $notifications,
            'activities' => $activities,
            'filters' => [
                'tab' => $activeTab,
                'search' => $request->input('search', ''),
                'channel' => $request->input('channel', ''),
                'status' => $request->input('status', ''),
                'action' => $request->input('action', ''),
            ],
        ]);
    }

    /**
     * Resend an alert from notification log.
     */
    public function resendNotification(int $id, Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403, 'Unauthorized.');

        $log = NotificationLog::with(['user', 'booking', 'serviceBooking'])->findOrFail($id);

        try {
            if ($log->booking !== null && $log->booking->user !== null) {
                $log->booking->user->notify(new BookingConfirmationNotification($log->booking));
            } elseif ($log->serviceBooking !== null && $log->serviceBooking->user !== null) {
                $log->serviceBooking->user->notify(new ServiceBookingConfirmedNotification($log->serviceBooking));
            } elseif ($log->user !== null) {
                // If a user exists but no attached booking, dispatch a retry record
                NotificationLog::create([
                    'user_id' => $log->user_id,
                    'booking_id' => $log->booking_id,
                    'service_booking_id' => $log->service_booking_id,
                    'channel' => $log->channel,
                    'template' => $log->template,
                    'status' => NotificationStatus::DELIVERED,
                    'sent_at' => now(),
                ]);
            }

            ActivityLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'notification.resend',
                'subject_type' => NotificationLog::class,
                'subject_id' => $log->id,
                'new_values' => [
                    'channel' => $log->channel instanceof NotificationChannel ? $log->channel->value : (string) $log->channel,
                    'recipient' => $log->user?->phone ?? $log->user?->email,
                    'booking_id' => $log->booking_id ?? $log->service_booking_id,
                ],
            ]);

            return redirect()->back()->with('success', 'Notification alert re-sent successfully.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Could not resend alert: '.$e->getMessage());
        }
    }
}

