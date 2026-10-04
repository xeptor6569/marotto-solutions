import { Bricolage_Grotesque, Geist, Geist_Mono, Newsreader } from 'next/font/google';

export const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

export const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

// Only referenced by some Looks; without preload the browser fetches them
// only when the active Look's CSS actually uses the family.
export const newsreader = Newsreader({
    variable: '--font-newsreader',
    subsets: ['latin'],
    style: ['normal', 'italic'],
    preload: false,
    display: 'swap',
});

export const bricolage = Bricolage_Grotesque({
    variable: '--font-bricolage',
    subsets: ['latin'],
    preload: false,
    display: 'swap',
});

export const fontVariables = [geistSans, geistMono, newsreader, bricolage]
    .map((font) => font.variable)
    .join(' ');
