import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import Heading from '@/components/shared/general/heading';
import InputError from '@/components/shared/general/input-error';
import PasswordInput from '@/components/shared/general/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { destroy } from '@/routes/settings/account/profile';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Hapus akun"
                description="Hapus akun Anda beserta seluruh datanya"
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Peringatan</p>
                    <p className="text-sm">
                        Harap berhati-hati, tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger
                        render={
                            <Button
                                variant="destructive"
                                data-test="delete-user-button"
                            />
                        }
                    >
                        Hapus akun
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            Apakah Anda yakin ingin menghapus akun Anda?
                        </DialogTitle>
                        <DialogDescription>
                            Setelah akun dihapus, seluruh data akun juga akan
                            dihapus secara permanen. Masukkan kata sandi Anda
                            untuk mengonfirmasi penghapusan permanen akun Anda.
                        </DialogDescription>

                        <Form
                            {...destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="password"
                                            className="sr-only"
                                        >
                                            Kata sandi
                                        </Label>

                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Kata sandi"
                                            autoComplete="current-password"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <DialogClose
                                            render={
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        resetAndClearErrors()
                                                    }
                                                />
                                            }
                                        >
                                            Batal
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            render={
                                                <button
                                                    type="submit"
                                                    data-test="confirm-delete-user-button"
                                                />
                                            }
                                        >
                                            Hapus akun
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
