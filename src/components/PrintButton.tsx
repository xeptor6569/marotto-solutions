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

const BAKED_COLOR_PROPS = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
] as const;

function isColorSentinel(color: string): boolean {
    const normalized = color.replace(/\s+/g, "").toLowerCase();
    return normalized === "#010101" || normalized === "rgb(1,1,1)" || normalized === "rgba(1,1,1,1)";
}

/**
 * html2canvas drops oklch and color-mix (Radix badge fills, accent tints).
 * Resolve each computed color through a canvas so the clone carries plain rgba.
 */
function bakeComputedColors(root: HTMLElement) {
    const view = root.ownerDocument.defaultView;
    if (!view) return;

    const canvas = root.ownerDocument.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const cache = new Map<string, string | null>();
    const resolve = (color: string): string | null => {
        const key = color.trim();
        if (!key || key === "transparent") return null;
        const cached = cache.get(key);
        if (cached !== undefined) return cached;

        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#010101";
        ctx.fillStyle = key;
        if (ctx.fillStyle === "#010101" && !isColorSentinel(key)) {
            cache.set(key, null);
            return null;
        }
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        const resolved = a === 0 ? null : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
        cache.set(key, resolved);
        return resolved;
    };

    const nodes: HTMLElement[] = [root, ...root.querySelectorAll<HTMLElement>("*")];
    for (const node of nodes) {
        const computed = view.getComputedStyle(node);
        for (const prop of BAKED_COLOR_PROPS) {
            const resolved = resolve(computed[prop]);
            if (resolved) node.style[prop] = resolved;
        }
    }
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
    emphasis = "print",
}: {
    label?: string;
    fileName?: string;
    /** Which of the two buttons is the solid one. */
    emphasis?: "print" | "pdf";
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
        document.documentElement.classList.add("pdf-export");
        try {
            // Let the browser apply .pdf-export styles before capture.
            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve());
            });
            const html2pdf = (await import("html2pdf.js")).default;
            await html2pdf()
                .set({
                    margin: [10, 10, 10, 10],
                    filename: `${resolvedFileName}.pdf`,
                    image: { type: "png" },
                    html2canvas: {
                        scale: 3,
                        useCORS: true,
                        backgroundColor: "#ffffff",
                        logging: false,
                        onclone: (clonedDoc: Document, element: HTMLElement) => {
                            const view = clonedDoc.defaultView;
                            const target = element
                                ?? clonedDoc.querySelector<HTMLElement>(".print-document");
                            if (target && view && target instanceof view.HTMLElement) {
                                bakeComputedColors(target);
                            }
                        },
                    },
                    jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
                })
                .from(root)
                .save();
        } catch {
            // Fall back to the browser print dialog (Save as PDF).
            withPrintTitle(resolvedFileName, () => window.print());
        } finally {
            document.documentElement.classList.remove("pdf-export");
            setSaving(false);
        }
    };

    return (
        <>
            <Button onClick={handlePrint} variant={emphasis === "print" ? "solid" : "soft"}>
                <Printer size={16} /> Print
            </Button>
            <Button onClick={handleSavePdf} variant={emphasis === "pdf" ? "solid" : "soft"} disabled={saving}>
                <Download size={16} /> {saving ? "Saving…" : "Save PDF"}
            </Button>
        </>
    );
}
