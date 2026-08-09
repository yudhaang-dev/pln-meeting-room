<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGeneralSettingRequest extends FormRequest
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
            'booking_advance_hours' => ['required', 'integer', 'min:0', 'max:720'],
            'booking_max_days_ahead' => ['required', 'integer', 'min:1', 'max:365'],
            'display_refresh_interval' => ['required', 'integer', 'min:5', 'max:300'],
            'media_loop_duration' => ['required', 'integer', 'min:3', 'max:120'],
            'audio_notification' => ['nullable', 'file', 'mimes:mp3,wav,ogg,m4a,aac,flac', 'max:10240'],
        ];
    }
}
