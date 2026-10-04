import type { LucideIcon } from 'lucide-react';

/** Rounded square holding an icon on a soft tint of a Radix color. */
export default function IconTile({
    icon: Icon,
    color = 'accent',
    size = 36,
}: {
    icon: LucideIcon;
    /** Radix color name, or "accent" for the theme accent. */
    color?: string;
    size?: number;
}) {
    return (
        <span
            className="icon-tile"
            aria-hidden
            style={{
                width: size,
                height: size,
                background: `var(--${color}-a3)`,
                color: `var(--${color}-11)`,
            }}
        >
            <Icon size={Math.round(size * 0.5)} />
        </span>
    );
}
