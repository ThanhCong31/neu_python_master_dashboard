export function sponsorshipPath(partner:string|null) {
  return '/sponsorship/summary'+(partner?`?${new URLSearchParams({partner})}`:'');
}
