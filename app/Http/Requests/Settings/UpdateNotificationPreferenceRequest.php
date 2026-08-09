<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferenceRequest extends FormRequest
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
            'audio_notification' => ['nullable', 'file', 'mimes:mp3,wav,ogg,m4a,aac,flac', 'max:10240'],
            'remove_audio' => ['nullable', 'boolean'],
        ];
    }
}
