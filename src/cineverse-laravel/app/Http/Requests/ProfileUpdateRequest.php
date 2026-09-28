<?php

/* ============================================================================
 * REQUEST: ProfileUpdateRequest.php
 * ============================================================================
 *
 * Request de validación para actualizar datos del perfil.
 *
 * Agrupa las reglas de username y email para mantener el flujo de perfil
 * alineado con las restricciones de registro.
 * ============================================================================ */

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Devuelve las reglas de validación aplicadas al perfil.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'min:3', 'max:20', 'regex:/^[A-Za-z0-9_]+$/'],
            'email' => [
                'required',
                'string',
                'email',
                'max:80',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}
