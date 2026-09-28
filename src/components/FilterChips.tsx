'use client';

export interface FilterChipOption<T extends string> {
    value: T;
    label: string;
    count?: number;
}

/** Horizontally scrolling pill filters; hidden when there is only one option. */
export default function FilterChips<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: FilterChipOption<T>[];
    value: T;
    onChange: (value: T) => void;
}) {
    if (options.length <= 1) return null;

    return (
        <div className="filter-chips" role="group" aria-label={label}>
            <span className="ui-eyebrow filter-chips-label">{label}</span>
            <div className="filter-chips-track">
                {options.map((option) => {
                    const active = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            className="filter-chip"
                            data-active={active || undefined}
                            aria-pressed={active}
                            onClick={() => onChange(option.value)}
                        >
                            {option.label}
                            {typeof option.count === 'number' ? (
                                <span className="filter-chip-count ui-figure">{option.count}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
