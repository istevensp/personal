const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatMonthYear(year: number, month?: number | null): string {
  if (month && month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${year}`;
  return String(year);
}

const PLACEHOLDER = '[PROPORCIONAR]';

function isValidUrl(value?: string | null): value is string {
  return !!value && value !== PLACEHOLDER;
}

const LINK_LABELS: Record<string, string> = {
  doi: 'View DOI',
  paper: 'View paper',
  preprint: 'View preprint',
  repository: 'View repository',
  program: 'View program',
  slides: 'View slides',
  dataset: 'View dataset',
};

export function primaryExternalLink(
  doi: string | null | undefined,
  links: Record<string, string>
): { url: string; label: string } | null {
  if (isValidUrl(doi)) return { url: doi, label: 'View DOI' };
  for (const [key, url] of Object.entries(links ?? {})) {
    if (isValidUrl(url)) {
      return { url, label: LINK_LABELS[key] ?? `View ${key}` };
    }
  }
  return null;
}
