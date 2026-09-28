'use client';

import { useMoney } from '@/components/MoneyProvider';

/** Formatted amount in the configured currency, with tabular figures. */
export default function Money({
    value,
    display = false,
    className,
}: {
    value: number;
    /** Headline treatment (KPIs, totals) using the Look's display face. */
    display?: boolean;
    className?: string;
}) {
    const { format } = useMoney();
    const classes = [display ? 'ui-display' : 'ui-figure', className].filter(Boolean).join(' ');
    return <span className={classes}>{format(value)}</span>;
}
