import { useEffect, useState } from 'react';

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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const atIndex = value.indexOf('@');
  const localPart = atIndex >= 0 ? value.slice(0, atIndex) : value;
  const typedDomain = atIndex >= 0 ? value.slice(atIndex + 1) : '';
  const suggestions =
    atIndex >= 0 && localPart
      ? COMMON_DOMAINS.filter(d => d.startsWith(typedDomain.toLowerCase()) && d !== typedDomain.toLowerCase())
      : [];

  // Whatever was highlighted no longer matches the new suggestion list once
  // the user keeps typing, so drop back to "nothing highlighted" instead of
  // pointing at a stale index.
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  function selectDomain(domain: string) {
    onChange(`${localPart}@${domain}`);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      selectDomain(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  }

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
        onKeyDown={handleKeyDown}
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
              onClick={() => selectDomain(domain)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition ${
                i === highlightedIndex ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'
              } ${i < suggestions.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
            >
              {localPart}@<span className="font-medium">{domain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
