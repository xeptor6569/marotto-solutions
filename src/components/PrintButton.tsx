'use client';

import { Button } from "@radix-ui/themes";
import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <Button onClick={() => window.print()}>
            <Printer size={16} /> Print Receipt
        </Button>
    );
}
