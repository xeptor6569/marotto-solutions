'use client';

import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { Check, Share2 } from "lucide-react";

export default function ShareButton({
    label = "Document",
    sharePath,
    shareTitle,
    businessName,
}: {
    label?: string;
    sharePath: string;
    shareTitle?: string;
    businessName?: string;
}) {
    const [copied, setCopied] = useState(false);
    const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    const handleShare = async () => {
        const url = new URL(sharePath, window.location.origin).toString();
        const title = shareTitle || label;
        const text = businessName ? `View ${title} from ${businessName}` : `View ${title}`;

        if (canUseNativeShare) {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt("Copy this link:", url);
        }
    };

    return (
        <Button onClick={handleShare} variant="soft">
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? "Link Copied" : `Share ${label}`}
        </Button>
    );
}
