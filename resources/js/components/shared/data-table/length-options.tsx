import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const defaultOptions = [10, 25, 50, 100];

type Props = {
    options?: number[];
    current?: number;
    onChange?: (length: number) => void;
};

export function LengthOptions({
    current = 10,
    options = defaultOptions,
    onChange,
}: Props) {
    const items = options.map((i) => {
        return { label: i, value: i };
    });

    return (
        <div className="flex flex-row items-center gap-2">
            <div className="text-muted-foreground text-xs">Tampilkan</div>
            <Select
                items={items}
                value={current}
                onValueChange={(value) => onChange?.(Number(value))}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {options.map((item) => (
                            <SelectItem key={item} value={item}>
                                {item}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <div className="text-muted-foreground text-xs">per page</div>
        </div>
    );
}
