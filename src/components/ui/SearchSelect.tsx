'use client';

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Popover, Text, TextField } from '@radix-ui/themes';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

export interface SearchSelectOption {
    value: string;
    label: string;
    /** Secondary text, e.g. an email or status. Also searched. */
    hint?: string;
}

/**
 * Type-to-filter picker for long lists (clients, jobs). Keyboard: arrows move,
 * Enter picks, Escape closes. The "none" row clears the selection.
 */
export default function SearchSelect({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    noneLabel = 'None',
    searchPlaceholder = 'Search…',
    emptyText = 'No matches',
    disabled = false,
    id,
    'aria-label': ariaLabel,
}: {
    value: string;
    onChange: (value: string) => void;
    options: SearchSelectOption[];
    placeholder?: string;
    /** Label for the clear row; pass null to hide it. */
    noneLabel?: string | null;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    id?: string;
    'aria-label'?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const listId = useId();
    const listRef = useRef<HTMLUListElement>(null);
    const selected = options.find((option) => option.value === value);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matches = q
            ? options.filter((option) => `${option.label} ${option.hint ?? ''}`.toLowerCase().includes(q))
            : options;
        return noneLabel !== null && !q ? [{ value: '', label: noneLabel }, ...matches] : matches;
    }, [options, query, noneLabel]);

    const pick = (next: string) => {
        onChange(next);
        setOpen(false);
        setQuery('');
    };

    const moveActive = (next: number) => {
        const clamped = Math.max(0, Math.min(rows.length - 1, next));
        setActive(clamped);
        listRef.current?.querySelector<HTMLElement>(`[data-index="${clamped}"]`)?.scrollIntoView({ block: 'nearest' });
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveActive(active + 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveActive(active - 1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const row = rows[active];
            if (row) pick(row.value);
        }
    };

    return (
        <Popover.Root
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) {
                    setQuery('');
                    const index = rows.findIndex((row) => row.value === value);
                    setActive(index >= 0 ? index : 0);
                }
            }}
        >
            <Popover.Trigger disabled={disabled}>
                <button
                    type="button"
                    id={id}
                    className="search-select-trigger"
                    aria-label={ariaLabel}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    data-placeholder={selected ? undefined : true}
                >
                    <span className="search-select-value">{selected ? selected.label : placeholder}</span>
                    {selected?.hint ? <span className="search-select-hint">{selected.hint}</span> : null}
                    <ChevronsUpDown size={14} aria-hidden className="search-select-chevron" />
                </button>
            </Popover.Trigger>
            <Popover.Content className="search-select-content" align="start" sideOffset={4}>
                <TextField.Root
                    size="2"
                    autoFocus
                    value={query}
                    placeholder={searchPlaceholder}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(0);
                    }}
                    onKeyDown={onKeyDown}
                    role="combobox"
                    aria-controls={listId}
                    aria-expanded
                    aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
                >
                    <TextField.Slot><Search size={14} /></TextField.Slot>
                </TextField.Root>
                <ul className="search-select-list" role="listbox" id={listId} ref={listRef}>
                    {rows.length === 0 ? (
                        <li className="search-select-empty"><Text size="2" color="gray">{emptyText}</Text></li>
                    ) : rows.map((row, index) => (
                        <li
                            key={row.value || '__none'}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={row.value === value}
                            data-index={index}
                            data-active={index === active || undefined}
                            data-none={row.value === '' || undefined}
                            className="search-select-option"
                            onMouseEnter={() => setActive(index)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(row.value)}
                        >
                            <span className="search-select-option-text">
                                <span>{row.label}</span>
                                {'hint' in row && row.hint ? <span className="search-select-hint">{row.hint}</span> : null}
                            </span>
                            {row.value === value ? <Check size={14} aria-hidden /> : null}
                        </li>
                    ))}
                </ul>
            </Popover.Content>
        </Popover.Root>
    );
}
