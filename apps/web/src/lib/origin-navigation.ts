export interface OriginDefinition {
  country: string;
  aliases?: string[];
  label: string;
  flag: string;
  desc: string;
}

export interface OriginSectionDefinition {
  title: string;
  description: string;
  countries: string[];
}

export const ORIGIN_DEFINITIONS: OriginDefinition[] = [
  { country: 'south-korea', aliases: ['korea'], label: 'South Korea', flag: '🇰🇷', desc: 'Korean skincare and beauty brands.' },
  { country: 'japan', label: 'Japan', flag: '🇯🇵', desc: 'Japanese skincare, sunscreen, and beauty picks.' },
  { country: 'china', label: 'China', flag: '🇨🇳', desc: 'Chinese beauty and personal care brands.' },
  { country: 'taiwan', label: 'Taiwan', flag: '🇹🇼', desc: 'Taiwanese skincare and beauty finds.' },
  { country: 'usa', label: 'USA', flag: '🇺🇸', desc: 'American skincare, body care, and makeup brands.' },
  { country: 'uk', label: 'UK', flag: '🇬🇧', desc: 'British skincare, haircare, and makeup brands.' },
  { country: 'france', label: 'France', flag: '🇫🇷', desc: 'French pharmacy and luxury skincare brands.' },
  { country: 'germany', label: 'Germany', flag: '🇩🇪', desc: 'German derma and personal care brands.' },
  { country: 'canada', label: 'Canada', flag: '🇨🇦', desc: 'Canadian skincare and beauty brands.' },
  { country: 'poland', label: 'Poland', flag: '🇵🇱', desc: 'Polish skincare and beauty brands.' },
  { country: 'spain', label: 'Spain', flag: '🇪🇸', desc: 'Spanish skincare and beauty brands.' },
  { country: 'india', label: 'India', flag: '🇮🇳', desc: 'Indian skincare, haircare, and makeup brands.' },
  { country: 'thailand', label: 'Thailand', flag: '🇹🇭', desc: 'Thai beauty and personal care finds.' },
  { country: 'bangladesh', label: 'Bangladesh', flag: '🇧🇩', desc: 'Bangladeshi beauty and personal care brands.' },
  { country: 'malaysia', label: 'Malaysia', flag: '🇲🇾', desc: 'Malaysian beauty and personal care brands.' },
  { country: 'philippines', label: 'Philippines', flag: '🇵🇭', desc: 'Philippine beauty and personal care brands.' },
  { country: 'sri-lanka', label: 'Sri Lanka', flag: '🇱🇰', desc: 'Sri Lankan beauty and personal care brands.' },
  { country: 'pakistan', label: 'Pakistan', flag: '🇵🇰', desc: 'Pakistani beauty and personal care brands.' },
  { country: 'uae', label: 'UAE', flag: '🇦🇪', desc: 'UAE beauty and personal care brands.' },
  { country: 'south-africa', label: 'South Africa', flag: '🇿🇦', desc: 'South African beauty and personal care brands.' },
  { country: 'turkey', label: 'Turkey', flag: '🇹🇷', desc: 'Turkish beauty and personal care brands.' },
  { country: 'multinational', label: 'Multinational', flag: '🌍', desc: 'Brands with multinational origin or ownership.' },
];

export const ORIGIN_SECTIONS: OriginSectionDefinition[] = [
  {
    title: 'East Asian Beauty',
    description: 'Country-level origin buckets from the cleaned brand-origin taxonomy.',
    countries: ['south-korea', 'japan', 'china', 'taiwan'],
  },
  {
    title: 'Western Beauty',
    description: 'USA, UK, Canada, and European brand origins.',
    countries: ['usa', 'uk', 'france', 'germany', 'canada', 'poland', 'spain'],
  },
  {
    title: 'South & Southeast Asia',
    description: 'Regional origins mapped brand-first, then assigned to products.',
    countries: ['india', 'thailand', 'bangladesh', 'malaysia', 'philippines', 'sri-lanka', 'pakistan'],
  },
  {
    title: 'More Origins',
    description: 'Additional verified country and multinational origin terms.',
    countries: ['uae', 'south-africa', 'turkey', 'multinational'],
  },
];

export function getOriginByCountry(country?: string) {
  if (!country) return undefined;
  const normalized = country.toLowerCase().trim();
  return ORIGIN_DEFINITIONS.find((origin) => (
    origin.country === normalized || origin.aliases?.includes(normalized)
  ));
}
