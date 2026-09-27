import type { LucideIcon } from 'lucide-react';
import {
    Briefcase,
    Building2,
    Code,
    Cpu,
    Hammer,
    Heart,
    Home,
    Laptop,
    Leaf,
    Lightbulb,
    MapPin,
    Monitor,
    Paintbrush,
    PlugZap,
    Shield,
    Sparkles,
    Star,
    Truck,
    Users,
    Wifi,
    Wrench,
    Zap,
} from 'lucide-react';

/**
 * Curated icon choices for user-configured public-site content (services and
 * highlights). Names are stored in settings; unknown names fall back safely.
 */
export const SITE_ICONS: Record<string, LucideIcon> = {
    briefcase: Briefcase,
    building: Building2,
    code: Code,
    cpu: Cpu,
    hammer: Hammer,
    heart: Heart,
    home: Home,
    laptop: Laptop,
    leaf: Leaf,
    lightbulb: Lightbulb,
    mapPin: MapPin,
    monitor: Monitor,
    paintbrush: Paintbrush,
    plug: PlugZap,
    shield: Shield,
    sparkles: Sparkles,
    star: Star,
    truck: Truck,
    users: Users,
    wifi: Wifi,
    wrench: Wrench,
    zap: Zap,
};

export const SITE_ICON_NAMES = Object.keys(SITE_ICONS);

export function getSiteIcon(name: string | undefined, fallback: LucideIcon = Wrench): LucideIcon {
    if (name && SITE_ICONS[name]) return SITE_ICONS[name];
    return fallback;
}
