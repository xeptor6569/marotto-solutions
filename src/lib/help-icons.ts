import type { LucideIcon } from 'lucide-react';
import {
    Archive,
    BookOpenText,
    CalendarDays,
    CreditCard,
    FileText,
    Inbox,
    LifeBuoy,
    Paintbrush,
    Repeat,
    Route,
    Sparkles,
    Users,
} from 'lucide-react';

const HELP_ICONS: Record<string, LucideIcon> = {
    archive: Archive,
    calendar: CalendarDays,
    creditCard: CreditCard,
    fileText: FileText,
    inbox: Inbox,
    lifeBuoy: LifeBuoy,
    paintbrush: Paintbrush,
    repeat: Repeat,
    route: Route,
    sparkles: Sparkles,
    users: Users,
};

export function getHelpIcon(name: string): LucideIcon {
    return HELP_ICONS[name] ?? BookOpenText;
}
