'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
    createMoneyFormatter,
    currencySymbol,
    DEFAULT_MONEY_FORMAT,
    type MoneyFormat,
    type MoneyFormatter,
} from '@/lib/money';

interface MoneyContextValue extends MoneyFormat {
    format: MoneyFormatter;
    symbol: string;
}

const MoneyContext = createContext<MoneyContextValue>({
    ...DEFAULT_MONEY_FORMAT,
    format: createMoneyFormatter(DEFAULT_MONEY_FORMAT),
    symbol: currencySymbol(DEFAULT_MONEY_FORMAT),
});

/** Supplies the configured currency to client components; rendered once in the root layout. */
export default function MoneyProvider({
    format,
    children,
}: {
    format: MoneyFormat;
    children: ReactNode;
}) {
    const value = useMemo<MoneyContextValue>(() => ({
        ...format,
        format: createMoneyFormatter(format),
        symbol: currencySymbol(format),
    }), [format]);

    return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

export function useMoney(): MoneyContextValue {
    return useContext(MoneyContext);
}
