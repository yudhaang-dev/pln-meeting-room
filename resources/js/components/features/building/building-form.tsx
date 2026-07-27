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
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import buildingRoutes from '@/routes/buildings';
import type { Building } from './building-data-table';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    building?: Building | null;
    onSuccess?: () => void;
};

const emptyForm = {
    name: '',
    is_active: true,
};

export function BuildingForm({
    open,
    onOpenChange,
    building,
    onSuccess,
}: Props) {
    const { data, setData, post, put, processing, reset, errors } =
        useForm(emptyForm);

    useEffect(() => {
        if (building) {
            setData({
                name: building.name,
                is_active: building.is_active,
            });
        } else {
            reset();
        }
    }, [building]);

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            reset();
        }
        onOpenChange(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccessCallback = () => {
            handleOpenChange(false);
            onSuccess?.();
        };

        if (building) {
            put(buildingRoutes.update(building.id).url, {
                onSuccess: onSuccessCallback,
            });
        } else {
            post(buildingRoutes.store().url, {
                onSuccess: onSuccessCallback,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {building ? 'Edit Building' : 'Create Building'}
                    </DialogTitle>
                    <DialogDescription>
                        {building
                            ? 'Update the building details below.'
                            : 'Fill in the details to create a new building.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
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
                    <div className="flex items-center gap-3 pb-0.5">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) =>
                                setData('is_active', checked)
                            }
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {building ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
