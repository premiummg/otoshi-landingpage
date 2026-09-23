import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Same library, same `.phone-input-field` class and defaultCountry="CA" as
// timesheet-payroll-system's own ProfilePage.tsx - as-you-type formatting
// for a real phone number instead of a plain text box.
export function PhoneField({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="CA"
      value={value}
      onChange={v => onChange(v ?? '')}
      className="phone-input-field"
    />
  );
}
