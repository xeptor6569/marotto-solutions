'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Toast } from 'radix-ui';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { FlashTone } from '@/lib/flash';

export interface ToastOptions {
    title: string;
    description?: string;
    tone?: FlashTone;
    /** Optional inline action, e.g. Undo or View. */
    action?: { label: string; onClick: () => void };
    duration?: number;
}

type ToastEntry = ToastOptions & { id: number; open: boolean };

const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

let nextToastId = 1;

function ToneIcon({ tone }: { tone: FlashTone }) {
    if (tone === 'error') return <AlertCircle size={18} />;
    if (tone === 'info') return <Info size={18} />;
    return <CheckCircle2 size={18} />;
}

/** App-wide toast stack (bottom-right on desktop, above the tab bar on phones). */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastEntry[]>([]);

    const push = useCallback((options: ToastOptions) => {
        const id = nextToastId++;
        setToasts((current) => [...current.slice(-2), { ...options, id, open: true }]);
    }, []);

    const dismiss = (id: number) => {
        setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)));
        // Keep the node around for the exit animation before dropping it.
        window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 300);
    };

    return (
        <ToastContext.Provider value={push}>
            <Toast.Provider swipeDirection="right" duration={5000} label="Notification">
                {children}
                {toasts.map((toast) => {
                    const tone = toast.tone ?? 'success';
                    return (
                        <Toast.Root
                            key={toast.id}
                            className="toast"
                            data-tone={tone}
                            open={toast.open}
                            duration={toast.duration ?? (tone === 'error' ? 8000 : 5000)}
                            onOpenChange={(open) => { if (!open) dismiss(toast.id); }}
                            type={tone === 'error' ? 'foreground' : 'background'}
                        >
                            <span className="toast-icon" aria-hidden><ToneIcon tone={tone} /></span>
                            <div className="toast-body">
                                <Toast.Title className="toast-title">{toast.title}</Toast.Title>
                                {toast.description ? (
                                    <Toast.Description className="toast-description">{toast.description}</Toast.Description>
                                ) : null}
                            </div>
                            {toast.action ? (
                                <Toast.Action asChild altText={toast.action.label}>
                                    <button type="button" className="toast-action" onClick={toast.action.onClick}>
                                        {toast.action.label}
                                    </button>
                                </Toast.Action>
                            ) : null}
                            <Toast.Close className="toast-close" aria-label="Dismiss">
                                <X size={14} />
                            </Toast.Close>
                        </Toast.Root>
                    );
                })}
                <Toast.Viewport className="toast-viewport" />
            </Toast.Provider>
        </ToastContext.Provider>
    );
}

/** `const toast = useToast(); toast({ title: 'Saved' })` */
export function useToast() {
    return useContext(ToastContext);
}
