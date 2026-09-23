import type { ReactNode } from 'react';
import { FormLabel, FieldError } from '@premiummg/ui';

// One field: label + whatever input the caller renders + its own error
// line, in the same order/spacing every field on this form uses.
export function Field({ label, htmlFor, required, optional, error, children }: {
  label: string; htmlFor: string; required?: boolean; optional?: boolean; error?: string; children: ReactNode;
}) {
  return (
    <div>
      <FormLabel text={label} htmlFor={htmlFor} required={required} optional={optional} />
      {children}
      <FieldError message={error} />
    </div>
  );
}
