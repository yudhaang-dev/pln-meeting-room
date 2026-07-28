<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $settings = app(GeneralSettings::class);

        return [
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'chairperson_id' => ['nullable', 'integer', 'exists:people,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['required', 'date', 'after:now'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'participants_count' => ['required', 'integer', 'min:1'],
            'attachment' => ['required', 'file', 'max:10240'],
            'qr_attendance' => ['nullable', 'image', 'max:5120'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $startTime = $this->input('start_time');
                $endTime = $this->input('end_time');

                if (! $startTime || ! $endTime) {
                    return;
                }

                $start = Carbon::parse($startTime);
                $end = Carbon::parse($endTime);

                $settings = app(GeneralSettings::class);

                $advanceDeadline = Carbon::now()->addHours($settings->booking_advance_hours);
                if ($start->lt($advanceDeadline)) {
                    $validator->errors()->add(
                        'start_time',
                        "Bookings must be made at least {$settings->booking_advance_hours} hour(s) in advance."
                    );
                }

                $maxDeadline = Carbon::now()->addDays($settings->booking_max_days_ahead);
                if ($start->gt($maxDeadline)) {
                    $validator->errors()->add(
                        'start_time',
                        "Bookings cannot be made more than {$settings->booking_max_days_ahead} day(s) in advance."
                    );
                }

                $roomId = $this->input('room_id');

                if ($roomId) {
                    $hasOverlap = Booking::where('room_id', $roomId)
                        ->whereIn('status', ['pending', 'approved'])
                        ->where('start_time', '<', $end)
                        ->where('end_time', '>', $start)
                        ->exists();

                    if ($hasOverlap) {
                        $validator->errors()->add(
                            'room_id',
                            'This room is already booked for the selected time slot.'
                        );
                    }
                }
            },
        ];
    }
}
