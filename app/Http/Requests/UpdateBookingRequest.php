<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'room_id' => ['sometimes', 'required', 'integer', 'exists:rooms,id'],
            'chairperson_id' => ['sometimes', 'required', 'integer', 'exists:people,id'],
            'osh_level_id' => ['sometimes', 'required', 'integer', 'exists:osh_levels,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date', 'after:start_time'],
            'participants_count' => ['sometimes', 'required', 'integer', 'min:1'],
            'media' => ['sometimes', 'required', Rule::in(['offline', 'hybrid'])],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'qr_attendance' => ['nullable', 'image', 'max:5120'],
            'status' => ['sometimes', 'required', Rule::in(['pending', 'approved', 'rejected'])],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<int, \Closure>
     */
    public function after(): array
    {
        return [
            function ($validator) {
                $roomId = $this->input('room_id');
                $startTime = $this->input('start_time');
                $endTime = $this->input('end_time');

                if (! $roomId || ! $startTime || ! $endTime) {
                    return;
                }

                $start = Carbon::parse($startTime);
                $end = Carbon::parse($endTime);

                $booking = $this->route('booking');

                if (! $booking instanceof Booking) {
                    return;
                }

                $hasOverlap = Booking::where('room_id', $roomId)
                    ->whereIn('status', ['pending', 'approved'])
                    ->where('id', '!=', $booking->id)
                    ->where('start_time', '<', $end)
                    ->whereRaw('COALESCE(ended_at, end_time) > ?', [$start->toDateTimeString()])
                    ->exists();

                if ($hasOverlap) {
                    $validator->errors()->add(
                        'room_id',
                        __('This room is already booked for the selected time slot.')
                    );
                }
            },
        ];
    }
}
