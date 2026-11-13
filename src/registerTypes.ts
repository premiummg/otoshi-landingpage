// Shared between the client form (src/pages/RegisterPage.tsx) and the
// serverless function that emails it (api/register.ts) - one contract, so
// the two can't silently drift out of shape.

export interface Participant {
  classKey: string;
  // Scoped to whichever class is picked - each class carries its own list of
  // valid schedule/price options. See registerData.ts.
  scheduleKey: string;
  firstName: string;
  lastName: string;
  dob: string; // yyyy-MM-dd
  gender: 'male' | 'female' | '';
  notes: string;
}

export function emptyParticipant(): Participant {
  return { classKey: '', scheduleKey: '', firstName: '', lastName: '', dob: '', gender: '', notes: '' };
}

export interface RegisterFormData {
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  emergency: {
    name: string;
    relationship: string;
    phone: string;
  };
  kidsCount: number;
  adultsCount: number;
  kids: Participant[];
  adults: Participant[];
  agreedJudoNb: boolean;
  agreedClub: boolean;
}

// What the browser actually POSTs: the form plus a few request-level fields.
export interface RegisterRequest extends RegisterFormData {
  // Generated once per page load; the server shows its first 8 characters as
  // the registration's reference in the club email and on the Square order.
  submissionId: string;
  turnstileToken?: string;
  // Which site language the family used, so Square can send them back to the
  // matching /register page after paying.
  lang?: 'en' | 'fr';
}

export function emptyRegisterForm(): RegisterFormData {
  return {
    parent: { firstName: '', lastName: '', email: '', phone: '', address: '', city: '', province: '', postalCode: '' },
    emergency: { name: '', relationship: '', phone: '' },
    kidsCount: 0,
    adultsCount: 0,
    kids: [],
    adults: [],
    agreedJudoNb: false,
    agreedClub: false,
  };
}

// Resizes a participant array to `count`, keeping already-entered data for
// indices that still exist rather than wiping the whole list every time a
// count changes by one.
export function resizeParticipants(list: Participant[], count: number): Participant[] {
  if (count === list.length) return list;
  if (count < list.length) return list.slice(0, count);
  return [...list, ...Array.from({ length: count - list.length }, emptyParticipant)];
}
