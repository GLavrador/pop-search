/**
 * How the page was reached from the link in a confirmation e-mail. Read as the
 * page loads, before the Supabase client takes the session out of the address.
 */
export type Arrival = 'confirmed' | 'linkFailed' | null;

export const readArrival = (hash: string): Arrival => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('error_code') || params.get('error')) return 'linkFailed';
  if (params.get('type') === 'signup' && params.get('access_token')) return 'confirmed';
  return null;
};

export const arrival: Arrival = readArrival(window.location.hash);
