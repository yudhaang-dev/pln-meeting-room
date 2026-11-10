<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Urutan dan visibilitas blok dashboard admin/operator, disimpan per akun.
 */
class DashboardLayout
{
    /** Blok yang dikenal, sekaligus urutan bawaan. */
    public const WIDGETS = ['rooms', 'events', 'participants', 'users', 'room_usage'];

    /**
     * Susunan efektif untuk user: pengaturan tersimpan yang sudah dibersihkan,
     * blok baru yang belum ada di pengaturan ditaruh di akhir.
     *
     * @return array{order: array<int, string>, hidden: array<int, string>, customized: bool}
     */
    public static function for(User $user): array
    {
        $saved = $user->dashboard_layout;

        if (! is_array($saved)) {
            return ['order' => self::WIDGETS, 'hidden' => [], 'customized' => false];
        }

        return [
            ...self::normalize($saved['order'] ?? [], $saved['hidden'] ?? []),
            'customized' => true,
        ];
    }

    /**
     * @param  array<int, mixed>  $order
     * @param  array<int, mixed>  $hidden
     * @return array{order: array<int, string>, hidden: array<int, string>}
     */
    public static function normalize(array $order, array $hidden): array
    {
        $known = self::WIDGETS;
        $order = array_values(array_unique(array_filter($order, fn ($id) => in_array($id, $known, true))));

        return [
            'order' => [...$order, ...array_values(array_diff($known, $order))],
            'hidden' => array_values(array_unique(array_filter($hidden, fn ($id) => in_array($id, $known, true)))),
        ];
    }

    /**
     * Simpan (atau hapus bila null). Memakai query langsung agar tidak masuk log
     * aktivitas sebagai "mengubah pengguna".
     *
     * @param  array{order: array<int, string>, hidden: array<int, string>}|null  $layout
     */
    public static function save(User $user, ?array $layout): void
    {
        DB::table('users')->where('id', $user->id)->update([
            'dashboard_layout' => $layout === null ? null : json_encode($layout),
        ]);
    }
}
