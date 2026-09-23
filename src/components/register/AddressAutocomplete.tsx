import { useEffect, useRef, useState } from 'react';
import { searchAddress, type AddressSuggestion } from '../../lib/nominatim';

function flagEmoji(countryCode: string): string {
  return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

// Free address autocomplete backed by OpenStreetMap/Nominatim - ported from
// Reel-FishR-React-Native's own AddressAutocomplete (same debounce/rate-limit
// discipline, see src/lib/nominatim.ts), rebuilt as a plain input + dropdown
// for the web instead of React Native's View/TextInput/Pressable. Meant to
// sit inside this form's own <Field> wrapper like the plain <input> it
// replaces - it renders no label itself.
export function AddressAutocomplete({ id, value, onChange, onSelect }: {
  id: string;
  value: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focused) {
      // Selecting a suggestion (or blurring) sets focused false while a
      // search might still be in flight - without this, the cleanup below
      // only marks that call cancelled, and nothing was left to ever turn
      // the spinner back off.
      setLoading(false);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      const results = await searchAddress(value);
      if (!cancelled) {
        setSuggestions(results);
        setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value, focused]);

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        data-1p-ignore
        className="input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        // A blur that fires because the user clicked a suggestion below
        // would otherwise close the dropdown before that click's own
        // onClick ever runs - the timeout lets the click land first.
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
      />
      {loading && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Searching…</p>}

      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-(--premium-dark-grey) shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => {
                onSelect(s);
                setSuggestions([]);
                setFocused(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                i < suggestions.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
              }`}
            >
              {s.countryCode ? `${flagEmoji(s.countryCode)} ` : ''}
              {s.displayName}
            </button>
          ))}
        </div>
      )}

      {/* Nominatim's own usage policy requires this attribution. */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Data from OpenStreetMap contributors</p>
    </div>
  );
}
