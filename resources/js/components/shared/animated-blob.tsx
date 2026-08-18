import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    duration?: number; // Durasi satu siklus meliuk dalam milidetik
    extreme?: number; // Menentukan seberapa ekstrem perubahan bentuk
    fill?: string; // Menerima string warna tunggal
    className?: string;
}

export default function AnimatedBlob({
    duration = 4000,
    extreme = 3.5,
    fill = 'fill-blue-500',
    className = '',
}: Props) {
    const [path, setPath] = useState('');
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const animateBlob = (time: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = time;
            }

            const progress = (time - startTimeRef.current) / duration;
            const angle = progress * Math.PI * 2;

            const offset1 = Math.sin(angle) * extreme;
            const offset2 = Math.cos(angle) * (extreme * 0.85);
            const offset3 = Math.sin(angle + 1.5) * (extreme * 0.85);
            const offset4 = Math.cos(angle + 1.5) * extreme;

            // KUNCI 1: Titik dasar dikembalikan ke area 8 dan 92 (memberi ruang aman 8 unit di setiap sisi)
            const p1 = { x: 50 + offset1, y: 8 + offset2 };
            const p2 = { x: 92 + offset3, y: 50 - offset1 };
            const p3 = { x: 50 - offset2, y: 92 + offset4 };
            const p4 = { x: 8 - offset4, y: 50 - offset3 };

            // Nilai tuas kendali disesuaikan ke 23 agar kelenturan bulatnya tetap seimbang
            const currentPath = `
                M ${p1.x},${p1.y}
                C ${p1.x + 23},${p1.y} ${p2.x},${p2.y - 23} ${p2.x},${p2.y}
                C ${p2.x},${p2.y + 23} ${p3.x + 23},${p3.y} ${p3.x},${p3.y}
                C ${p3.x - 23},${p3.y} ${p4.x},${p4.y + 23} ${p4.x},${p4.y}
                C ${p4.x},${p4.y - 23} ${p1.x - 23},${p1.y} ${p1.x},${p1.y} Z
            `.replace(/\s+/g, ' ');

            setPath(currentPath);
            requestRef.current = requestAnimationFrame(animateBlob);
        };

        requestRef.current = requestAnimationFrame(animateBlob);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [duration, extreme]);

    return (
        <div className={cn('relative h-full w-full', className)}>
            {/* KUNCI 2: viewBox diperlebar ke area minus agar luapan ekstrem tidak terpotong */}
            {/* KUNCI 3: Ditambahkan kelas 'overflow-visible' dari Tailwind */}
            <svg
                viewBox="-10 -10 120 120"
                className="h-full w-full overflow-visible"
                preserveAspectRatio="none"
            >
                <path d={path} className={cn(fill)} />
            </svg>
        </div>
    );
}
