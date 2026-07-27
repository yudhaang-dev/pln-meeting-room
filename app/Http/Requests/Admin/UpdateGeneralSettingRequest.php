<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGeneralSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_advance_hours' => ['required', 'integer', 'min:0', 'max:720'],
            'booking_max_days_ahead' => ['required', 'integer', 'min:1', 'max:365'],
            'cancellation_hours' => ['required', 'integer', 'min:0', 'max:168'],
            'auto_approve_bookings' => ['required', 'boolean'],
            'default_osh_level_id' => ['nullable', 'integer', 'exists:osh_levels,id'],
            'display_refresh_interval' => ['required', 'integer', 'min:5', 'max:300'],
            'media_loop_duration' => ['required', 'integer', 'min:3', 'max:120'],
        ];
    }
}
