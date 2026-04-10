'use client';

import { Button } from "@radix-ui/themes";
import { Printer } from "lucide-react";

export default function PrintButton({ label = 'Document' }: { label?: string }) {
    return (
        <Button onClick={() => window.print()}>
            <Printer size={16} /> Print {label}
        </Button>
    );
}
