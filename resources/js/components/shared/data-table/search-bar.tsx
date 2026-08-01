import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type SearchBarProps = {
    placeholder?: string;
    search: string;
    onSearch: (value: string) => void;
    perPage: string;
    onPerPage: (value: string) => void;
    children?: React.ReactNode;
};

export function SearchBar({
    placeholder = 'Search...',
    search,
    onSearch,
    perPage,
    onPerPage,
    children,
}: SearchBarProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-9"
                />
            </div>
            {children}
            <Select
                value={perPage}
                onValueChange={(value) => value !== null && onPerPage(value)}
            >
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="5">5 / page</SelectItem>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
