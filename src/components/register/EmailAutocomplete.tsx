import { useState } from 'react';

const COMMON_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'msn.com'];

// Suggests common email domains once the user has typed "@" - not a real
// address book, just the same handful of providers that cover almost every
// parent's own email, so finishing the domain is a click instead of typing
// it out. Same dropdown-under-the-field shape as AddressAutocomplete, no
// network call needed here.
export function EmailAutocomplete({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  const atIndex = value.indexOf('@');
  const localPart = atIndex >= 0 ? value.slice(0, atIndex) : value;
  const typedDomain = atIndex >= 0 ? value.slice(atIndex + 1) : '';
  const suggestions =
    atIndex >= 0 && localPart
      ? COMMON_DOMAINS.filter(d => d.startsWith(typedDomain.toLowerCase()) && d !== typedDomain.toLowerCase())
      : [];

  return (
    <div className="relative">
      <input
        id={id}
        type="email"
        data-1p-ignore
        className="input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        // Same reasoning as AddressAutocomplete: the timeout lets a
        // suggestion's own onClick fire before blur closes the dropdown out
        // from under it.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />

      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-(--premium-dark-grey) shadow-lg">
          {suggestions.map((domain, i) => (
            <button
              key={domain}
              type="button"
              onClick={() => onChange(`${localPart}@${domain}`)}
              className={`w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                i < suggestions.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
              }`}
            >
              {localPart}@<span className="font-medium">{domain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
