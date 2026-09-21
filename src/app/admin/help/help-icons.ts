import type { LucideIcon } from 'lucide-react';
import {
    Archive,
    BookOpenText,
    CalendarDays,
    CreditCard,
    FileText,
    LifeBuoy,
    Paintbrush,
    Repeat,
    Sparkles,
    Users,
} from 'lucide-react';

const HELP_ICONS: Record<string, LucideIcon> = {
    archive: Archive,
    calendar: CalendarDays,
    creditCard: CreditCard,
    fileText: FileText,
    lifeBuoy: LifeBuoy,
    paintbrush: Paintbrush,
    repeat: Repeat,
    sparkles: Sparkles,
    users: Users,
};

export function getHelpIcon(name: string): LucideIcon {
    return HELP_ICONS[name] ?? BookOpenText;
}
