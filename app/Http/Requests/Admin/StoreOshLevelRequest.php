<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreOshLevelRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'min_participants' => ['required', 'integer', 'min:1'],
            'max_participants' => ['required', 'integer', 'min:1', 'gte:min_participants'],
            'sort_order' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
