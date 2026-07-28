'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type MonitorFrameProps = {
    title?: string;
} & ComponentProps<'div'>;

export function MonitorFrame({
    children,
    title = 'Studio Display',
    className,
}: MonitorFrameProps) {
    return (
        <div
            className={cn(
                'mx-auto flex w-full select-none flex-col items-center justify-center font-sans tracking-normal',
                className,
            )}
        >
            {/* 1. BADAN UTAMA MONITOR */}
            <div className="relative w-full rounded-[24px] border border-white/10 bg-[#18181b] p-[10px] pb-0 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.02)] ring-1 ring-black/40">
                {/* Lensa Kamera & Sensor Cahaya Tersembunyi */}
                <div className="absolute left-1/2 top-[5px] flex h-[5px] w-8 -translate-x-1/2 items-center justify-center gap-1.5 opacity-80">
                    <div className="h-[4px] w-[4px] rounded-full border border-zinc-800 bg-[#09090b] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                    <div className="h-[3px] w-[3px] rounded-full bg-[#1e40af]/30 shadow-[0_0_2px_rgba(59,130,246,0.5)]" />
                </div>

                {/* 2. AREA LAYAR DALAM (Rasio 16:9 + Lapisan Kaca Pantul) */}
                <div className="relative aspect-video w-full overflow-hidden rounded-[14px] border border-black/80 bg-[#030303] shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
                    {/* Media Player Konten Utama */}
                    <div className="relative z-10 h-full w-full">
                        {children}
                    </div>

                    {/* LAPISAN KACA REALISTIS (Glossy Reflection Overlay) */}
                    {/* Menggunakan efek gradien halus memotong diagonal untuk meniru pantulan cahaya ruangan */}
                    <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] mix-blend-overlay" />
                    <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-[45%] origin-top -skew-x-12 transform bg-gradient-to-l from-white/[0.015] via-transparent to-transparent" />
                </div>

                {/* 3. CHIN BAR (Aluminium Sikat / Brushed Metal Efek) */}
                <div className="relative flex h-12 w-full items-center justify-between rounded-b-[22px] border-t border-[#f4f4f5]/60 bg-gradient-to-b from-[#e4e4e7] via-[#d4d4d8] to-[#a1a1aa] px-6 shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),inset_0_-3px_6px_rgba(0,0,0,0.15)]">
                    {/* Logo/Teks Tipografi Premium */}
                    <div className="mx-auto pl-6 font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-600/70 drop-shadow-[0_1px_0px_rgba(255,255,255,0.6)]">
                        {title}
                    </div>

                    {/* Lampu Indikator Daya LED Nyata */}
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981,0_0_3px_#34d399,inset_0_1px_1px_rgba(255,255,255,0.4)]" />
                    </div>
                </div>
            </div>

            {/* 4. TIANG PENYANGGA (Aluminium Stand Berdimensi 3D) */}
            <div className="relative h-20 w-28 border-x border-black/10 bg-gradient-to-r from-[#b4b4b8] via-[#e4e4e7] to-[#9a9a9e] shadow-[inset_0_4px_10px_rgba(0,0,0,0.25)]">
                {/* Bayangan Bayangan Kontak (Ambient Occlusion Shadow) dari Monitor ke Tiang */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/50 to-transparent" />
                {/* Potongan Sisi Perspektif Bawah */}
                <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            {/* 5. DUDUKAN KAKI MONITOR (Solid Metallic Base) */}
            <div className="relative h-3 w-56 rounded-b-2xl rounded-t-[4px] border-x border-t border-black/10 border-white/80 bg-gradient-to-b from-[#f4f4f5] via-[#d4d4d8] to-[#71717a] shadow-[0_15px_20px_-5px_rgba(0,0,0,0.4)]">
                {/* Bayangan internal lekukan kaki */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-black/10" />
            </div>

            {/* 6. BAYANGAN REALISTIS DI MEJA/LANTAI */}
            {/* Menggabungkan blur ganda untuk menghasilkan bayangan kabur alami dunia nyata */}
            <div className="relative mt-1.5 h-4 w-72">
                <div className="absolute inset-0 scale-x-110 rounded-full bg-black/20 blur-md" />
                <div className="scale-y-70 absolute inset-x-8 top-0.5 rounded-full bg-black/30 blur-sm" />
            </div>
        </div>
    );
}
