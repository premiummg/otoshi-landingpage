import type { ReactNode } from 'react';
import { FormLabel, FieldError } from '@premiummg/ui';

// One field: label + whatever input the caller renders + its own error
// line, in the same order/spacing every field on this form uses.
export function Field({ label, htmlFor, required, optional, error, children }: {
  label: string; htmlFor: string; required?: boolean; optional?: boolean; error?: string; children: ReactNode;
}) {
  // `data-invalid` marks this field for RegisterPage's scroll-to-first-error
  // behaviour - a plain attribute on our own wrapper rather than depending
  // on @premiummg/ui's FieldError's internal class names staying the same.
  return (
    <div data-invalid={error ? 'true' : undefined}>
      <FormLabel text={label} htmlFor={htmlFor} required={required} optional={optional} />
      {children}
      <FieldError message={error} />
    </div>
  );
}
