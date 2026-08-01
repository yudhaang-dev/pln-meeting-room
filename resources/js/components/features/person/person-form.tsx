import { useForm } from '@inertiajs/react';
import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import personRoutes from '@/routes/people';

type Person = {
    id: number;
    name: string;
    photo: string | null;
    photo_url: string | null;
    is_active: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    person?: Person | null;
    onSuccess?: () => void;
};

const emptyForm = {
    name: '',
    photo: null as File | null,
    is_active: true,
};

export function PersonForm({
    open,
    onOpenChange,
    person = null,
    onSuccess,
}: Props) {
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, put, processing, reset, errors } =
        useForm(emptyForm);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (person) {
            setData({
                name: person.name,
                photo: null,
                is_active: person.is_active,
            });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPreview(person.photo_url);
        } else {
            reset();
            setPreview(null);
        }
    }, [open, person, reset, setData]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            setData('photo', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const handleSuccess = () => {
            onOpenChange(false);
            reset();
            setPreview(null);
            onSuccess?.();
        };

        if (person) {
            put(personRoutes.update(person.id).url, {
                forceFormData: true,
                onSuccess: handleSuccess,
            });
        } else {
            post(personRoutes.store().url, {
                forceFormData: true,
                onSuccess: handleSuccess,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {person ? 'Edit Person' : 'Create Person'}
                    </DialogTitle>
                    <DialogDescription>
                        {person
                            ? 'Update the person details below.'
                            : 'Fill in the details to create a new person.'}
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                    className="grid gap-4"
                >
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
                    <div className="grid gap-2">
                        <Label>Photo</Label>
                        <div className="flex items-center gap-4">
                            <div className="bg-muted flex size-16 items-center justify-center overflow-hidden rounded-full border">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <Camera className="text-muted-foreground size-6" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:mr-2 file:mt-0.5 file:inline-flex file:items-center file:rounded-md file:border-0 file:px-3 file:py-1 file:text-xs file:font-medium"
                                />
                                <p className="text-muted-foreground mt-1 text-xs">
                                    JPG, PNG. Max 2MB.
                                </p>
                            </div>
                        </div>
                        {errors.photo && (
                            <p className="text-destructive text-sm">
                                {errors.photo}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
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
                            {person ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
