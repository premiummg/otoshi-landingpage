// Shared between the client form (src/pages/RegisterPage.tsx) and the
// serverless function that emails it (api/register.ts) - one contract, so
// the two can't silently drift out of shape.

export interface Participant {
  classKey: string;
  // Independent of classKey - not yet confirmed whether Dieppe pairs each
  // level to exactly one schedule/price or offers a choice like Riverview's
  // old form did for some levels. See registerData.ts.
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
    fullName: string;
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

export function emptyRegisterForm(): RegisterFormData {
  return {
    parent: { fullName: '', email: '', phone: '', address: '', city: '', province: '', postalCode: '' },
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
