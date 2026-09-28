'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Flex, Heading, IconButton, Progress, Text } from '@radix-ui/themes';
import { ArrowRight, Check, ChevronDown, PartyPopper, Rocket, X } from 'lucide-react';
import { setOnboardingChecklistDismissedAction } from '@/app/admin/onboarding-actions';
import { useToast } from '@/components/ui/Toaster';
import type { OnboardingChecklist as Checklist } from '@/lib/onboarding';

/** Dismissible getting-started card on the dashboard. */
export default function OnboardingChecklist({
    checklist,
    defaultExpanded = false,
}: {
    checklist: Checklist;
    defaultExpanded?: boolean;
}) {
    const router = useRouter();
    const toast = useToast();
    const [expanded, setExpanded] = useState(defaultExpanded || checklist.completed <= 2);
    const [isPending, startTransition] = useTransition();
    const percent = Math.round((checklist.completed / checklist.total) * 100);

    const dismiss = () => {
        startTransition(async () => {
            const result = await setOnboardingChecklistDismissedAction(true);
            if (!result.success) {
                toast({ title: 'Could not hide the checklist', description: result.error, tone: 'error' });
                return;
            }
            router.refresh();
            toast({
                title: 'Checklist hidden',
                tone: 'info',
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        await setOnboardingChecklistDismissedAction(false);
                        router.refresh();
                    },
                },
            });
        });
    };

    return (
        <Card size="3" className="onboarding-card">
            <Flex align="start" justify="between" gap="3">
                <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                    <span className="onboarding-icon" aria-hidden>
                        {checklist.allDone ? <PartyPopper size={20} /> : <Rocket size={20} />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                        <Heading size="4" as="h2">
                            {checklist.allDone ? "You're all set up" : 'Get set up'}
                        </Heading>
                        <Text size="2" color="gray">
                            {checklist.allDone
                                ? 'Every step is done. You can hide this card.'
                                : `${checklist.completed} of ${checklist.total} done${checklist.next ? ` · Next: ${checklist.next.title.toLowerCase()}` : ''}`}
                        </Text>
                    </div>
                </Flex>
                <Flex gap="1" align="center" flexShrink="0">
                    {!checklist.allDone ? (
                        <IconButton
                            variant="ghost"
                            color="gray"
                            onClick={() => setExpanded((v) => !v)}
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse checklist' : 'Expand checklist'}
                        >
                            <ChevronDown size={18} className="onboarding-chevron" data-open={expanded || undefined} />
                        </IconButton>
                    ) : null}
                    <IconButton variant="ghost" color="gray" onClick={dismiss} loading={isPending} aria-label="Hide checklist">
                        <X size={18} />
                    </IconButton>
                </Flex>
            </Flex>

            <Progress value={percent} size="1" mt="4" aria-label={`${percent}% complete`} />

            {expanded && !checklist.allDone ? (
                <ol className="onboarding-steps">
                    {checklist.steps.map((step) => (
                        <li key={step.id} className="onboarding-step" data-done={step.done || undefined}>
                            <span className="onboarding-step-check" aria-hidden>
                                {step.done ? <Check size={14} /> : null}
                            </span>
                            <div className="onboarding-step-body">
                                <Text as="div" size="2" weight="medium">{step.title}</Text>
                                {!step.done ? <Text as="div" size="1" color="gray">{step.description}</Text> : null}
                            </div>
                            {!step.done ? (
                                <Button asChild size="1" variant={step.id === checklist.next?.id ? 'solid' : 'soft'}>
                                    <Link href={step.href}>{step.cta} <ArrowRight size={12} /></Link>
                                </Button>
                            ) : (
                                <span className="visually-hidden">Done</span>
                            )}
                        </li>
                    ))}
                </ol>
            ) : null}
        </Card>
    );
}
