import PhoneInput from 'react-phone-number-input';
// The library's stylesheet is imported from index.css, not here - see the
// comment there for why this component's own lazy chunk can't carry it.

// Same library and `.phone-input-field` class as timesheet-payroll-system's
// own ProfilePage.tsx - as-you-type formatting for a real phone number
// instead of a plain text box. No `international` prop: with a country
// selected (defaulting to CA), the library formats in that country's own
// national style - "(506) 555-1234" - instead of "+1 506 555 1234".
export function PhoneField({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <PhoneInput
      id={id}
      defaultCountry="CA"
      value={value}
      onChange={v => onChange(v ?? '')}
      className="phone-input-field"
    />
  );
}
