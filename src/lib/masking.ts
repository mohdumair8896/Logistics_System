// ─── Masking personal identifiers in list views ───────────────────────────────
// DPDP Rules, rule 6 lists masking as a reasonable security safeguard. Lists, hover cards, alerts and
// to-do items show only the last 4 characters; the driver's own dossier shows the full number.

/** "MH1220190012345" → "•••• 2345". Values of 4 characters or fewer are hidden completely. */
export function maskLicence(value: string | null | undefined): string {
  const compact = (value ?? '').replace(/\s+/g, '');
  if (!compact) return '';
  if (compact.length <= 4) return '••••';
  return `•••• ${compact.slice(-4)}`;
}
