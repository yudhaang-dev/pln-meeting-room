<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoomGroupRequest extends FormRequest
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
            'building_id' => ['required', 'exists:buildings,id'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'room_ids' => ['nullable', 'array'],
            'room_ids.*' => ['exists:rooms,id'],
        ];
    }
}
