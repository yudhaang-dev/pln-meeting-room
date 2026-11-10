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
import { InputGroup } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import oshLevelRoutes from '@/routes/osh-levels';

type OshLevel = {
    id: number;
    name: string;
    color: string;
    min_participants: number;
    max_participants: number;
    sort_order: number;
    is_active: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    level?: OshLevel | null;
    onSuccess?: () => void;
};

const emptyForm = {
    name: '',
    color: '#22c55e',
    min_participants: 1,
    max_participants: 100,
    sort_order: 1,
    is_active: true,
};

export function OshLevelForm({ open, onOpenChange, level, onSuccess }: Props) {
    const isEditing = !!level;

    const { data, setData, post, put, processing, reset, errors } =
        useForm(emptyForm);

    useEffect(() => {
        if (level) {
            setData({
                name: level.name,
                color: level.color,
                min_participants: level.min_participants,
                max_participants: level.max_participants,
                sort_order: level.sort_order,
                is_active: level.is_active,
            });
        } else {
            reset();
        }
    }, [level, reset, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const onSuccessCallback = () => {
            reset();
            onOpenChange(false);
            onSuccess?.();
        };

        if (isEditing && level) {
            put(oshLevelRoutes.update(level.id).url, {
                onSuccess: onSuccessCallback,
            });
        } else {
            post(oshLevelRoutes.store().url, {
                onSuccess: onSuccessCallback,
            });
        }
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Ubah Level K3' : 'Tambah Level K3'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Ubah rincian level K3 di bawah ini.'
                            : 'Isi rincian untuk menambah level K3 baru.'}
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
                        <Label htmlFor="color">Warna</Label>
                        <InputGroup>
                            <Input
                                id="color"
                                type="color"
                                value={data.color}
                                onChange={(e) =>
                                    setData('color', e.target.value)
                                }
                                className="size-10 cursor-pointer rounded border"
                            />
                            <Input
                                value={data.color}
                                onChange={(e) =>
                                    setData('color', e.target.value)
                                }
                                className="w-28 font-mono"
                            />
                        </InputGroup>
                        {errors.color && (
                            <p className="text-destructive text-sm">
                                {errors.color}
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="min_participants">
                                Peserta Minimum
                            </Label>
                            <Input
                                id="min_participants"
                                type="number"
                                min={1}
                                value={data.min_participants}
                                onChange={(e) =>
                                    setData(
                                        'min_participants',
                                        parseInt(e.target.value) || 1,
                                    )
                                }
                            />
                            {errors.min_participants && (
                                <p className="text-destructive text-sm">
                                    {errors.min_participants}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="max_participants">
                                Peserta Maksimum
                            </Label>
                            <Input
                                id="max_participants"
                                type="number"
                                min={1}
                                value={data.max_participants}
                                onChange={(e) =>
                                    setData(
                                        'max_participants',
                                        parseInt(e.target.value) || 1,
                                    )
                                }
                            />
                            {errors.max_participants && (
                                <p className="text-destructive text-sm">
                                    {errors.max_participants}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sort_order">Urutan</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min={1}
                                value={data.sort_order}
                                onChange={(e) =>
                                    setData(
                                        'sort_order',
                                        parseInt(e.target.value) || 1,
                                    )
                                }
                            />
                        </div>
                        <div className="flex items-end gap-3 pb-0.5">
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked)
                                }
                            />
                            <Label htmlFor="is_active">Aktif</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Batal
                        </Button>
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
