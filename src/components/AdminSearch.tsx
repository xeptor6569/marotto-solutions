'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Dialog, Flex, Kbd, Text, TextField } from '@radix-ui/themes';
import { Search } from 'lucide-react';
import { searchAdminRecords } from '@/app/admin/search/actions';
import {
    ADMIN_SEARCH_KIND_LABEL,
    rankAdminSearchHits,
    type AdminSearchHit,
} from '@/lib/smart-search';

export default function AdminSearch() {
    const router = useRouter();
    const listId = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<AdminSearchHit[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState(0);

    const openRef = useRef(false);

    const setDialogOpen = (next: boolean) => {
        openRef.current = next;
        setOpen(next);
        if (next) setError(null);
        else setQuery('');
    };

    useEffect(() => {
        const onKey = (event: globalThis.KeyboardEvent) => {
            if (event.repeat) return;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                const next = !openRef.current;
                openRef.current = next;
                setOpen(next);
                if (next) setError(null);
                else setQuery('');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        searchAdminRecords().then((result) => {
            if (cancelled) return;
            if (result.success) {
                setHits(result.hits);
            } else {
                setHits([]);
                setError(result.error);
            }
        }).catch(() => {
            if (cancelled) return;
            setHits([]);
            setError('Search is unavailable right now.');
        });
        return () => {
            cancelled = true;
        };
    }, [open]);

    const results = useMemo(
        () => (query.trim() && hits ? rankAdminSearchHits(query, hits) : []),
        [query, hits],
    );
    const highlighted = results.length === 0 ? 0 : Math.min(active, results.length - 1);

    useEffect(() => {
        if (!open || results.length === 0) return;
        document.getElementById(`${listId}-option-${highlighted}`)?.scrollIntoView({ block: 'nearest' });
    }, [open, listId, highlighted, results.length]);

    const go = (hit: AdminSearchHit) => {
        setDialogOpen(false);
        router.push(hit.href);
    };

    const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter' && results[highlighted]) {
            event.preventDefault();
            go(results[highlighted]);
        }
    };

    const trimmed = query.trim();
    let status: string | null = null;
    if (error) status = error;
    else if (open && hits === null) status = 'Searching…';
    else if (!trimmed) status = 'Type a name, number, phone, or a few words.';
    else if (results.length === 0) status = 'No matches.';

    return (
        <>
            <Button
                type="button"
                variant="soft"
                color="gray"
                size="2"
                className="admin-search-trigger"
                aria-label="Search"
                aria-keyshortcuts="Meta+K Control+K"
                onClick={() => setDialogOpen(true)}
            >
                <Search size={16} aria-hidden />
                <span className="admin-search-label">Search</span>
                <Kbd className="admin-search-kbd" aria-hidden>⌘K</Kbd>
            </Button>

            <Dialog.Root open={open} onOpenChange={setDialogOpen}>
                <Dialog.Content
                    className="admin-search-dialog"
                    style={{ maxWidth: 560 }}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        document.getElementById('admin-search-input')?.focus();
                    }}
                >
                    <Dialog.Title>Search</Dialog.Title>
                    <Dialog.Description size="2" color="gray" mb="3">
                        Clients, jobs, documents, and contracts
                    </Dialog.Description>
                    <TextField.Root
                        id="admin-search-input"
                        size="3"
                        placeholder="Search…"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onInputKeyDown}
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={results.length > 0 ? `${listId}-option-${highlighted}` : undefined}
                        autoComplete="off"
                    >
                        <TextField.Slot>
                            <Search size={16} aria-hidden />
                        </TextField.Slot>
                    </TextField.Root>

                    {status ? (
                        <Text as="p" size="2" color={error ? 'red' : 'gray'} mt="3" mb="1">
                            {status}
                        </Text>
                    ) : null}

                    {results.length > 0 ? (
                        <ul className="admin-search-results" id={listId} role="listbox" aria-label="Search results">
                            {results.map((hit, index) => (
                                <li key={`${hit.kind}-${hit.id}`}>
                                    <Link
                                        href={hit.href}
                                        id={`${listId}-option-${index}`}
                                        role="option"
                                        aria-selected={index === highlighted}
                                        data-active={index === highlighted || undefined}
                                        className="admin-search-hit"
                                        onMouseEnter={() => setActive(index)}
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        <span className="admin-search-kind">{ADMIN_SEARCH_KIND_LABEL[hit.kind]}</span>
                                        <Flex direction="column" style={{ minWidth: 0 }}>
                                            <Text size="2" weight="medium" truncate>{hit.title}</Text>
                                            {hit.subtitle ? (
                                                <Text size="1" color="gray" truncate>{hit.subtitle}</Text>
                                            ) : null}
                                        </Flex>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </Dialog.Content>
            </Dialog.Root>
        </>
    );
}
