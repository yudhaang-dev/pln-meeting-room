import { Head, usePoll } from '@inertiajs/react';
import { Activity, LogIn, SearchIcon, ShieldAlert, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LengthOptions } from '@/components/shared/data-table/length-options';
import { NavPagination } from '@/components/shared/data-table/nav-pagination';
import { PageContainer } from '@/components/shared/page-container';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useCrudIndex } from '@/hooks/use-crud-index';
import { cn, formatDate, formatTime } from '@/lib/utils';
import type { PaginatedData } from '@/lib/utils';

type LogRow = {
    id: number;
    created_at: string;
    event: string;
    description: string;
    user: { id: number; name: string; role: string } | null;
    actor_email: string | null;
    ip_address: string | null;
    browser: string | null;
    changes: string[];
};

type OnlineUser = {
    id: number;
    name: string;
    role: string;
    ips: string[];
    browser: string | null;
    sessions: number;
    last_activity: string;
};

type Props = {
    logs: PaginatedData<LogRow>;
    online: OnlineUser[];
    online_minutes: number;
    summary: {
        online: number;
        actions_today: number;
        logins_today: number;
        failed_24h: number;
    };
};

const CATEGORIES: { value: string | undefined; label: string }[] = [
    { value: undefined, label: 'Semua' },
    { value: 'auth', label: 'Login' },
    { value: 'failed', label: 'Login Gagal' },
    { value: 'booking', label: 'Booking' },
    { value: 'master', label: 'Data Master' },
    { value: 'user', label: 'Pengguna' },
    { value: 'system', label: 'Sistem' },
];

const ROLE_LABEL: Record<string, string> = {
    admin: 'Admin',
    operator: 'Operator',
    user: 'User',
};

function eventBadge(event: string) {
    if (event === 'auth.failed' || event === 'auth.lockout') {
        return <Badge variant="destructive">Login gagal</Badge>;
    }

    if (event.startsWith('auth.')) {
        return <Badge variant="secondary">Login</Badge>;
    }

    if (event.startsWith('booking.')) {
        return <Badge>Booking</Badge>;
    }

    if (event.startsWith('system.')) {
        return <Badge variant="destructive">Sistem</Badge>;
    }

    if (event.startsWith('user.')) {
        return <Badge variant="outline">Pengguna</Badge>;
    }

    return <Badge variant="outline">Data master</Badge>;
}

function StatCard({
    label,
    value,
    icon,
    tone,
}: {
    label: string;
    value: number;
    icon: ReactNode;
    tone: string;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>
                    <span className="text-foreground text-3xl font-semibold tabular-nums">
                        {value}
                    </span>
                </CardDescription>
                <CardAction>
                    <div
                        className={cn(
                            'flex size-12 items-center justify-center rounded-full',
                            tone,
                        )}
                    >
                        {icon}
                    </div>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

const stamp = (value: string) => `${formatDate(value)} ${formatTime(value)}`;

export default function ActivityPage({
    logs,
    online,
    online_minutes,
    summary,
}: Props) {
    usePoll(30_000, { only: ['logs', 'online', 'summary'] });

    const { search, perPage, status, navigate } = useCrudIndex({
        indexRoute: '/admin/activity',
        defaultPerPage: '25',
    });

    const [searchInput, setSearchInput] = useState(search);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback(
        (value: string) => {
            setSearchInput(value);

            if (timer.current) {
                clearTimeout(timer.current);
            }

            timer.current = setTimeout(
                () => navigate({ search: value, page: 1 }),
                300,
            );
        },
        [navigate],
    );

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    return (
        <>
            <Head title="Log Aktivitas" />
            <PageContainer>
                <div>
                    <h1 className="text-2xl font-bold">Log Aktivitas</h1>
                    <p className="text-muted-foreground text-sm">
                        Siapa melakukan apa, dari IP mana. Log disimpan 180
                        hari.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="User Online"
                        value={summary.online}
                        icon={<Users className="size-5" />}
                        tone="bg-green-100 text-green-700"
                    />
                    <StatCard
                        label="Aktivitas Hari Ini"
                        value={summary.actions_today}
                        icon={<Activity className="size-5" />}
                        tone="bg-primary/10 text-primary"
                    />
                    <StatCard
                        label="Login Hari Ini"
                        value={summary.logins_today}
                        icon={<LogIn className="size-5" />}
                        tone="bg-blue-100 text-blue-700"
                    />
                    <StatCard
                        label="Login Gagal (24 jam)"
                        value={summary.failed_24h}
                        icon={<ShieldAlert className="size-5" />}
                        tone={
                            summary.failed_24h > 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-muted text-muted-foreground'
                        }
                    />
                </div>

                <Card className="gap-0 pb-0">
                    <CardHeader>
                        <CardTitle className="text-base">
                            User Online
                        </CardTitle>
                        <CardDescription>
                            Aktif dalam {online_minutes} menit terakhir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Peran</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Perangkat</TableHead>
                                    <TableHead>Aktif Terakhir</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {online.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground h-16 text-center text-sm"
                                        >
                                            Tidak ada user online.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    online.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">
                                                {u.name}
                                                {u.sessions > 1 && (
                                                    <span className="text-muted-foreground ml-2 text-xs">
                                                        ({u.sessions} sesi)
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {ROLE_LABEL[u.role] ?? u.role}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {u.ips.join(', ') || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {u.browser ?? '-'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {formatTime(u.last_activity)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="gap-0 pb-0">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Riwayat Aktivitas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="gap-0 divide-y p-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2">
                            <div className="flex flex-wrap gap-1.5">
                                {CATEGORIES.map((c) => (
                                    <button
                                        type="button"
                                        key={c.label}
                                        onClick={() =>
                                            navigate({
                                                status: c.value,
                                                page: 1,
                                            })
                                        }
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-semibold',
                                            (status ?? undefined) === c.value
                                                ? 'bg-foreground text-background'
                                                : 'bg-muted text-muted-foreground hover:bg-accent',
                                        )}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                                <Input
                                    placeholder="Cari nama, email, IP, atau aktivitas..."
                                    value={searchInput}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    className="w-full pl-9 md:w-[300px]"
                                />
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>Pengguna</TableHead>
                                    <TableHead>Aktivitas</TableHead>
                                    <TableHead>IP</TableHead>
                                    <TableHead>Perangkat</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-muted-foreground h-24 text-center text-sm"
                                        >
                                            Belum ada aktivitas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap text-xs">
                                                {stamp(log.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">
                                                    {log.user?.name ??
                                                        log.actor_email ??
                                                        '-'}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {log.user
                                                        ? (ROLE_LABEL[
                                                              log.user.role
                                                          ] ?? log.user.role)
                                                        : 'Tidak dikenal'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[420px]">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {eventBadge(log.event)}
                                                    <span className="text-sm">
                                                        {log.description}
                                                    </span>
                                                </div>
                                                {log.user === null &&
                                                    log.actor_email && (
                                                        <div className="text-muted-foreground mt-1 text-xs">
                                                            Email dicoba:{' '}
                                                            {log.actor_email}
                                                        </div>
                                                    )}
                                                {log.changes.length > 0 && (
                                                    <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                                                        {log.changes.map(
                                                            (line) => (
                                                                <li key={line}>
                                                                    {line}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.ip_address ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {log.browser ?? '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2">
                            <LengthOptions
                                current={Number(perPage)}
                                onChange={(length) =>
                                    navigate({ per_page: length, page: 1 })
                                }
                            />
                            <NavPagination
                                data={{
                                    current_page: logs.current_page,
                                    last_page: logs.last_page,
                                    total: logs.total,
                                }}
                                onChange={(page) => navigate({ page })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </PageContainer>
        </>
    );
}
