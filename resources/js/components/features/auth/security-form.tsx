import type { Method, UrlMethodPair } from '@inertiajs/core';
import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import type { Props as ManagePasskeysProps } from '@/components/features/auth/manage-passkeys';
import Heading from '@/components/shared/general/heading';
import InputError from '@/components/shared/general/input-error';
import PasswordInput from '@/components/shared/general/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Props = {
    action: string | UrlMethodPair;
    method?: Method | Uppercase<Method>;
    passwordRules: string;
} & ManagePasskeysProps;

export default function SecurityForm({
    action,
    method = 'post',
    passwordRules,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <h1 className="sr-only">Pengaturan keamanan</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Ubah kata sandi"
                    description="Pastikan akun Anda memakai kata sandi yang panjang dan acak agar tetap aman"
                />

                <Form
                    action={action}
                    method={method}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">
                                    Kata sandi saat ini
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className="mt-1 block w-full"
                                    autoComplete="current-password"
                                    placeholder="Kata sandi saat ini"
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Kata sandi baru
                                </Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="Kata sandi baru"
                                    passwordrules={passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi kata sandi
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="Konfirmasi kata sandi"
                                    passwordrules={passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                >
                                    Simpan
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
