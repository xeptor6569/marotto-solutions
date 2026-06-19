'use client';

import { Badge, Button, DropdownMenu, Flex, Text } from '@radix-ui/themes';
import { WORKFLOW_STATUSES, workflowStatusLabel, workflowStatusColor } from '@/lib/workflow-status';
import type { WorkflowStatus } from '@/lib/types';

interface WorkflowStatusSelectProps {
    value?: WorkflowStatus;
    onChange: (value: WorkflowStatus | undefined) => void;
    size?: '1' | '2';
}

export default function WorkflowStatusSelect({ value, onChange, size = '2' }: WorkflowStatusSelectProps) {
    if (value) {
        return (
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <Button variant="soft" size={size} color={workflowStatusColor(value) as 'gray' | 'orange' | 'blue' | 'green'}>
                        {workflowStatusLabel(value)}
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start">
                    {WORKFLOW_STATUSES.map((s) => (
                        <DropdownMenu.Item
                            key={s}
                            onClick={() => onChange(s)}
                        >
                            <Flex gap="2" align="center">
                                <Badge color={workflowStatusColor(s) as 'gray' | 'orange' | 'blue' | 'green'} size="1" />
                                {workflowStatusLabel(s)}
                            </Flex>
                        </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onClick={() => onChange(undefined)} color="red">
                        Clear
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        );
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <Button variant="outline" size={size}>
                    <Text color="gray">Set workflow</Text>
                </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start">
                {WORKFLOW_STATUSES.map((s) => (
                    <DropdownMenu.Item
                        key={s}
                        onClick={() => onChange(s)}
                    >
                        <Flex gap="2" align="center">
                            <Badge color={workflowStatusColor(s) as 'gray' | 'orange' | 'blue' | 'green'} size="1" />
                            {workflowStatusLabel(s)}
                        </Flex>
                    </DropdownMenu.Item>
                ))}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}
