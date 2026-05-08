interface VersionBadge {
  flag: string;
  label: string;
}

const VERSION_MAP: Record<string, VersionBadge> = {
  us: { flag: '🇺🇸', label: 'USA Version' },
  uk: { flag: '🇬🇧', label: 'UK Version' },
  eu: { flag: '🇪🇺', label: 'EU Version' },
  fr: { flag: '🇫🇷', label: 'French Version' },
};

export function getVersionBadge(version?: string): VersionBadge | null {
  if (!version) return null;
  return VERSION_MAP[version] ?? null;
}
