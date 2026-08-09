import { SaveIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

function Loader({
    showText = true,
}: { showText?: boolean } & ComponentProps<'div'>) {
    return (
        <div className="flex items-center gap-2">
            <Spinner />
            {showText && <span>processing ...</span>}
        </div>
    );
}

function DefaultContent({
    showText = true,
}: { showText?: boolean } & ComponentProps<'div'>) {
    return (
        <div className="flex items-center gap-2">
            {showText && <span>Save</span>}
            <SaveIcon />
        </div>
    );
}

type Props = {
    processing?: boolean;
    showText?: boolean;
} & ComponentProps<typeof Button>;

export function SubmitButton({
    processing = false,
    showText = true,
    children,
    ...props
}: Props) {
    return (
        <Button type="submit" {...props}>
            {processing ? (
                <Loader showText={showText} />
            ) : children ? (
                children
            ) : (
                <DefaultContent showText={showText} />
            )}
        </Button>
    );
}
