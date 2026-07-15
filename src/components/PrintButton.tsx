'use client';

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { Download, Printer } from "lucide-react";

function sanitizeFileName(name: string) {
    return name
        .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || "Document";
}

function getPrintRoot(): HTMLElement | null {
    return document.querySelector<HTMLElement>(".print-document");
}

function withPrintTitle(fileName: string, action: () => void) {
    const previousTitle = document.title;
    document.title = fileName;
    let restored = false;
    const restore = () => {
        if (restored) return;
        restored = true;
        document.title = previousTitle;
        window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    action();
    window.setTimeout(restore, 2000);
}

export default function PrintButton({
    label = "Document",
    fileName,
}: {
    label?: string;
    fileName?: string;
}) {
    const [saving, setSaving] = useState(false);
    const resolvedFileName = sanitizeFileName(fileName || label);

    const handlePrint = () => {
        withPrintTitle(resolvedFileName, () => window.print());
    };

    const handleSavePdf = async () => {
        const root = getPrintRoot();
        if (!root) {
            withPrintTitle(resolvedFileName, () => window.print());
            return;
        }

        setSaving(true);
        try {
            const html2pdf = (await import("html2pdf.js")).default;
            await html2pdf()
                .set({
                    margin: [10, 10, 10, 10],
                    filename: `${resolvedFileName}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#ffffff",
                        logging: false,
                    },
                    jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
                })
                .from(root)
                .save();
        } catch {
            // Fall back to the browser print dialog (Save as PDF).
            withPrintTitle(resolvedFileName, () => window.print());
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Button onClick={handlePrint}>
                <Printer size={16} /> Print
            </Button>
            <Button onClick={handleSavePdf} variant="soft" disabled={saving}>
                <Download size={16} /> {saving ? "Saving…" : "Save PDF"}
            </Button>
        </>
    );
}
