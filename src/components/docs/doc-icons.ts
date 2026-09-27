import { Archive, Globe, LifeBuoy, Rocket, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import type { DocIcon } from '@/lib/docs';

const ICONS: Record<DocIcon, LucideIcon> = {
    rocket: Rocket,
    sliders: SlidersHorizontal,
    globe: Globe,
    archive: Archive,
    lifeBuoy: LifeBuoy,
};

export function getDocIcon(icon: DocIcon): LucideIcon {
    return ICONS[icon];
}
