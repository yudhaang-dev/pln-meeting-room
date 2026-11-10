import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import userRoutes from '@/routes/users';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User | null;
    onSuccess?: () => void;
};

const emptyForm = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
};

export function UserForm({ open, onOpenChange, user, onSuccess }: Props) {
    const isEditing = !!user;

    const { data, setData, post, put, processing, reset, errors } =
        useForm(emptyForm);

    useEffect(() => {
        if (open) {
            if (user) {
                setData({
                    name: user.name,
                    email: user.email,
                    password: '',
                    password_confirmation: '',
                    role: user.role,
                });
            } else {
                reset();
            }
        }
    }, [open, user, reset, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccessCallback = () => {
            reset();
            onOpenChange(false);
            onSuccess?.();
        };

        if (isEditing) {
            put(userRoutes.update(user.id).url, {
                onSuccess: onSuccessCallback,
            });
        } else {
            post(userRoutes.store().url, {
                onSuccess: onSuccessCallback,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Pengguna' : 'Tambah Pengguna'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah rincian pengguna di bawah ini. Kosongkan kata sandi untuk tetap memakai yang lama.'
                            : 'Isi rincian untuk menambah pengguna baru.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-destructive text-sm">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-destructive text-sm">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Kata sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                        />
                        {isEditing && (
                            <p className="text-muted-foreground text-xs">
                                Kosongkan untuk tetap memakai yang lama.
                            </p>
                        )}
                        {errors.password && (
                            <p className="text-destructive text-sm">
                                {errors.password}
                            </p>
                        )}
                    </div>
                    {data.password && (
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">
                                Konfirmasi Kata Sandi
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="role">Peran</Label>
                        <Select
                            value={data.role}
                            onValueChange={(value) => {
                                if (value !== null) {
                                    setData('role', value);
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih peran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="operator">
                                    Operator
                                </SelectItem>
                                <SelectItem value="user">Pengguna</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-destructive text-sm">
                                {errors.role}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {isEditing ? 'Simpan' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
