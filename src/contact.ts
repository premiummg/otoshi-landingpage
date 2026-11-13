// One home for the club's contact address, shared by the site (palette.ts,
// copy.ts) and the serverless functions (api/register.ts), so it can't drift.
export const CLUB_EMAIL = 'judo.otoshi.dieppe@gmail.com';

// The public address of the site. Square sends families back here after
// paying, so on production it is fixed rather than read from request headers.
export const CLUB_SITE_URL = 'https://otoshi.ca';
