<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Models\OshLevel;
use App\Settings\GeneralSettings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation()
    {
        $osh_level = OshLevel::determineForParticipants($this->participants_count ?? 1);
        if (empty($osh_level)) {
            $osh_level = OshLevel::orderByDesc('max_participants')->first();
        }
        $this->merge([
            'osh_level_id' => $osh_level->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'chairperson_id' => ['required', 'integer', 'exists:people,id'],
            'osh_level_id' => ['required', 'integer', 'exists:osh_levels,id'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['required', 'date', 'after:now'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'participants_count' => ['required', 'integer', 'min:1'],
            'attachment' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'qr_attendance' => ['required', 'image', 'max:5120'],
        ];
    }

    /**
     * @return array<int, \Closure>
     */
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
