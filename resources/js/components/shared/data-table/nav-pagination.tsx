import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

type PaginatedData = {
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    onChange: (page: number) => void;
    data: PaginatedData;
};

export function NavPagination({ onChange, data }: Props) {
    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();

                            if (data.current_page > 1) {
                                onChange(data.current_page - 1);
                            }
                        }}
                        aria-disabled={data.current_page <= 1}
                        className={
                            data.current_page <= 1
                                ? 'pointer-events-none opacity-50'
                                : ''
                        }
                    />
                </PaginationItem>
                {Array.from({ length: data.last_page }, (_, i) => i + 1)
                    .filter((page) => {
                        const last = data.last_page;
                        const current = data.current_page;

                        return (
                            page === 1 ||
                            page === last ||
                            Math.abs(page - current) <= 1
                        );
                    })
                    .reduce<(number | 'ellipsis')[]>((acc, page, i, arr) => {
                        if (i > 0 && page - (arr[i - 1] as number) > 1) {
                            acc.push('ellipsis');
                        }

                        acc.push(page);

                        return acc;
                    }, [])
                    .map((item, i) => (
                        <PaginationItem key={i}>
                            {item === 'ellipsis' ? (
                                <span className="text-muted-foreground px-3 py-1 text-sm">
                                    ...
                                </span>
                            ) : (
                                <PaginationLink
                                    href="#"
                                    isActive={item === data.current_page}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onChange(item);
                                    }}
                                >
                                    {item}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();

                            if (data.current_page < data.last_page) {
                                onChange(data.current_page + 1);
                            }
                        }}
                        aria-disabled={data.current_page >= data.last_page}
                        className={
                            data.current_page >= data.last_page
                                ? 'pointer-events-none opacity-50'
                                : ''
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
