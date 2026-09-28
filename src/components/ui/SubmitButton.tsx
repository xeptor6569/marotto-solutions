'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@radix-ui/themes';

/** Submit button that shows a spinner and disables itself while its form is pending. */
export default function SubmitButton({ disabled, ...props }: ComponentProps<typeof Button>) {
    const { pending } = useFormStatus();
    return <Button type="submit" {...props} loading={pending} disabled={disabled || pending} />;
}
