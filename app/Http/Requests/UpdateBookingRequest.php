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

    public function rules(): array
    {
        return [
            'room_id' => ['sometimes', 'required', 'integer', 'exists:rooms,id'],
            'chairperson_id' => ['nullable', 'integer', 'exists:people,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date', 'after:start_time'],
            'participants_count' => ['sometimes', 'required', 'integer', 'min:1'],
            'status' => ['sometimes', 'required', Rule::in(['pending', 'approved', 'rejected'])],
            'reason' => ['nullable', 'string', 'max:1000'],
            'qr_attendance' => ['nullable', 'image', 'max:5120'],
        ];
    }

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

                $hasOverlap = Booking::where('room_id', $roomId)
                    ->whereIn('status', ['pending', 'approved'])
                    ->where('id', '!=', $this->route('booking')->id)
                    ->where('start_time', '<', $end)
                    ->where('end_time', '>', $start)
                    ->exists();

                if ($hasOverlap) {
                    $validator->errors()->add(
                        'room_id',
                        'This room is already booked for the selected time slot.'
                    );
                }
            },
        ];
    }
}
