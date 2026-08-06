'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ThemeAppearance } from '@/lib/types';

/**
 * Light/dark/system switcher. The active appearance lives as a `light`/`dark`
 * class on <html> (Radix Theme uses appearance="inherit"), and the choice is
 * persisted in a cookie so the server renders the right theme on the next
 * request with no flash.
 */

const COOKIE = 'appearance';

// Cookies are not reactive, so preference changes made through this component
// notify subscribers manually (also keeps multiple toggles on a page in sync).
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function readPreference(): ThemeAppearance {
    const match = document.cookie.match(/(?:^|;\s*)appearance=(light|dark|system)/);
    if (match) return match[1] as ThemeAppearance;
    return (document.documentElement.dataset.defaultAppearance as ThemeAppearance) || 'system';
}

function applyAppearance(pref: ThemeAppearance) {
    const resolved = pref === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : pref;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
}

export default function ThemeToggle({ size = '2' }: { size?: '1' | '2' | '3' }) {
    const pref = useSyncExternalStore(subscribe, readPreference, () => 'system' as ThemeAppearance);

    // Follow live OS appearance changes while in system mode.
    useEffect(() => {
        if (pref !== 'system') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyAppearance('system');
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [pref]);

    const select = (next: ThemeAppearance) => {
        document.cookie = `${COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
        applyAppearance(next);
        for (const listener of listeners) listener();
    };

    const Icon = pref === 'system' ? Monitor : pref === 'dark' ? Moon : Sun;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <IconButton variant="ghost" color="gray" size={size} aria-label="Change color theme">
                    <Icon size={size === '3' ? 20 : 16} />
                </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.RadioGroup
                    value={pref}
                    onValueChange={(value) => select(value as ThemeAppearance)}
                >
                    <DropdownMenu.RadioItem value="light">
                        <Sun size={14} /> Light
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="dark">
                        <Moon size={14} /> Dark
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="system">
                        <Monitor size={14} /> System
                    </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
