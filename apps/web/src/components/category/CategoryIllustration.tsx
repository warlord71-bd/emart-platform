import type { ReactElement } from 'react';

type Props = {
  slug: string;
  uid?: string | number;
};

function safeId(slug: string, uid?: string | number) {
  return `cat${String(uid ?? slug).replace(/[^a-zA-Z0-9]/g, '')}`;
}

function Shell({ slug, children }: { slug: string; children: ReactElement }) {
  const dark = /hair|cream|moist|night/i.test(slug);
  return (
    <svg viewBox="0 0 180 240" width="100%" height="100%" aria-hidden="true" focusable="false" role="img">
      <rect width="180" height="240" fill={dark ? '#1B1B2F' : '#FAF6EE'} />
      <circle cx="34" cy="48" r="4" fill={dark ? '#EAC986' : '#D4A248'} opacity=".45" />
      <circle cx="150" cy="74" r="3" fill="#E8739E" opacity=".35" />
      <circle cx="142" cy="200" r="4" fill={dark ? '#EAC986' : '#D4A248'} opacity=".28" />
      {children}
    </svg>
  );
}

function KBeauty() {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Shell slug="k-beauty">
      <g>
        <path d="M28 226 C58 172 92 118 146 54" fill="none" stroke="#1B1B2F" strokeWidth="2.4" strokeLinecap="round" opacity=".45" />
        <g transform="translate(92 118)">
          {petals.map((angle, index) => (
            <ellipse key={angle} cx="0" cy="-17" rx="10" ry="18" fill={index % 2 ? '#F5C2D5' : '#E8739E'} transform={`rotate(${angle})`} />
          ))}
          <circle r="7" fill="#D4A248" />
        </g>
        <g transform="translate(56 166) scale(.72)">
          {petals.map((angle, index) => (
            <ellipse key={angle} cx="0" cy="-17" rx="10" ry="18" fill={index % 2 ? '#F5C2D5' : '#E8739E'} transform={`rotate(${angle})`} opacity=".9" />
          ))}
          <circle r="7" fill="#D4A248" />
        </g>
        <g transform="translate(132 82) scale(.62)">
          {petals.map((angle, index) => (
            <ellipse key={angle} cx="0" cy="-17" rx="10" ry="18" fill={index % 2 ? '#F5C2D5' : '#E8739E'} transform={`rotate(${angle})`} opacity=".85" />
          ))}
          <circle r="7" fill="#D4A248" />
        </g>
      </g>
    </Shell>
  );
}

function JBeauty() {
  return (
    <Shell slug="j-beauty">
      <g>
        <circle cx="90" cy="112" r="44" fill="#FFFDF8" stroke="#D4A248" strokeWidth="2" opacity=".95" />
        <path d="M90 64 C110 90 128 118 90 174 C52 118 70 90 90 64Z" fill="#E8739E" opacity=".2" />
        <path d="M90 78 C104 104 114 124 90 158 C66 124 76 104 90 78Z" fill="#E8739E" opacity=".7" />
        <path d="M54 184 C76 168 104 168 126 184" fill="none" stroke="#1B1B2F" strokeWidth="2.2" strokeLinecap="round" opacity=".45" />
        <path d="M51 70 C62 55 77 52 90 64 C103 52 118 55 129 70" fill="none" stroke="#D4A248" strokeWidth="2" strokeLinecap="round" opacity=".72" />
      </g>
    </Shell>
  );
}

function Toner({ id }: { id: string }) {
  return (
    <Shell slug="toner">
      <g>
        <defs>
          <linearGradient id={`${id}Bottle`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2F2F4A" />
            <stop offset="100%" stopColor="#1B1B2F" />
          </linearGradient>
        </defs>
        <ellipse cx="90" cy="208" rx="48" ry="10" fill="none" stroke="#E8739E" opacity=".18" />
        <rect x="72" y="82" width="36" height="122" rx="9" fill={`url(#${id}Bottle)`} />
        <rect x="68" y="72" width="44" height="14" rx="6" fill="#D4A248" />
        <rect x="86" y="28" width="8" height="46" rx="4" fill="#1B1B2F" />
        <ellipse cx="90" cy="24" rx="17" ry="10" fill="#25253E" />
        <ellipse cx="84" cy="178" rx="4" ry="6" fill="#E8739E" opacity=".85" />
        <ellipse cx="96" cy="193" rx="3" ry="5" fill="#E8739E" opacity=".62" />
      </g>
    </Shell>
  );
}

function Moisturizer({ id }: { id: string }) {
  return (
    <Shell slug="moisturizer">
      <g>
        <defs>
          <radialGradient id={`${id}Glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8739E" stopOpacity=".22" />
            <stop offset="100%" stopColor="#E8739E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="90" cy="132" rx="68" ry="68" fill={`url(#${id}Glow)`} />
        <ellipse cx="90" cy="192" rx="44" ry="8" fill="black" opacity=".24" />
        <rect x="46" y="144" width="88" height="48" rx="13" fill="#FFFDF8" />
        <rect x="46" y="114" width="88" height="34" rx="11" fill="#FAF6EE" />
        <ellipse cx="90" cy="114" rx="44" ry="11" fill="#FFFDF8" />
        <path d="M70 114 Q77 98 84 108 Q89 96 94 109 Q101 98 110 114" fill="#FFFDF8" stroke="#E6E1D6" strokeWidth=".7" />
        <path d="M38 82h13M44 75v14M142 94h13M148 87v14" stroke="#D4A248" strokeWidth="2" strokeLinecap="round" opacity=".72" />
      </g>
    </Shell>
  );
}

function Hydration({ id }: { id: string }) {
  return (
    <Shell slug="hydration">
      <g>
        <defs>
          <linearGradient id={`${id}Drop`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FB3FF" />
            <stop offset="100%" stopColor="#E8739E" />
          </linearGradient>
        </defs>
        <path d="M90 48 C124 91 136 120 136 148 C136 178 115 199 90 199 C65 199 44 178 44 148 C44 120 56 91 90 48Z" fill={`url(#${id}Drop)`} opacity=".9" />
        <path d="M71 150 C73 171 88 182 108 176" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".55" />
        <circle cx="126" cy="82" r="9" fill="#D4A248" opacity=".55" />
        <circle cx="55" cy="84" r="6" fill="#EAC986" opacity=".55" />
      </g>
    </Shell>
  );
}

function Sunscreen() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Shell slug="sunscreen">
      <g>
        <path d="M34 150 Q34 84 90 72 Q146 84 146 150" fill="none" stroke="#E8739E" strokeWidth="4" strokeLinecap="round" opacity=".18" />
        {rays.map((angle, index) => {
          const rad = (angle * Math.PI) / 180;
          const length = index % 2 ? 42 : 54;
          return (
            <line
              key={angle}
              x1="90"
              y1="110"
              x2={90 + length * Math.sin(rad)}
              y2={110 - length * Math.cos(rad)}
              stroke="#D4A248"
              strokeWidth={index % 2 ? 2 : 3}
              strokeLinecap="round"
              opacity=".78"
            />
          );
        })}
        <circle cx="90" cy="110" r="31" fill="#D4A248" />
        <circle cx="90" cy="110" r="23" fill="#EAC986" />
      </g>
    </Shell>
  );
}

function EyeCare() {
  return (
    <Shell slug="eye-care">
      <g>
        <path d="M34 122 C56 92 124 92 146 122 C124 152 56 152 34 122Z" fill="#FFFDF8" stroke="#1B1B2F" strokeWidth="2.4" opacity=".9" />
        <circle cx="90" cy="122" r="24" fill="#E8739E" opacity=".72" />
        <circle cx="90" cy="122" r="11" fill="#1B1B2F" />
        <path d="M52 82 C68 70 82 68 98 74" fill="none" stroke="#D4A248" strokeWidth="2.2" strokeLinecap="round" opacity=".72" />
        <path d="M82 174 C102 182 120 178 136 164" fill="none" stroke="#D4A248" strokeWidth="2.2" strokeLinecap="round" opacity=".5" />
      </g>
    </Shell>
  );
}

function MaskCare() {
  return (
    <Shell slug="mask">
      <g>
        <rect x="50" y="62" width="80" height="126" rx="28" fill="#FFFDF8" stroke="#E8739E" strokeWidth="2" />
        <circle cx="74" cy="112" r="7" fill="#1B1B2F" opacity=".45" />
        <circle cx="106" cy="112" r="7" fill="#1B1B2F" opacity=".45" />
        <path d="M74 145 C84 154 99 154 108 145" fill="none" stroke="#1B1B2F" strokeWidth="2" strokeLinecap="round" opacity=".38" />
        <path d="M56 92 C42 84 38 70 50 60" fill="none" stroke="#D4A248" strokeWidth="2" strokeLinecap="round" opacity=".58" />
        <path d="M124 92 C138 84 142 70 130 60" fill="none" stroke="#D4A248" strokeWidth="2" strokeLinecap="round" opacity=".58" />
      </g>
    </Shell>
  );
}

function Cleanser() {
  const bubbles = [
    [90, 112, 38],
    [54, 92, 24],
    [132, 96, 26],
    [68, 150, 21],
    [118, 144, 19],
    [90, 172, 16],
  ];
  return (
    <Shell slug="cleanser">
      <g>
        {bubbles.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="white" stroke="#E8739E" strokeWidth="1.4" opacity=".9" />
        ))}
        <path d="M90 38 Q80 52 80 61 Q80 71 90 71 Q100 71 100 61 Q100 52 90 38" fill="#E8739E" opacity=".72" />
      </g>
    </Shell>
  );
}

function BodyCare() {
  return (
    <Shell slug="body-care">
      <g>
        <rect x="62" y="70" width="56" height="132" rx="18" fill="#FFFDF8" stroke="#1B1B2F" strokeWidth="2" opacity=".96" />
        <rect x="72" y="50" width="36" height="26" rx="9" fill="#D4A248" />
        <rect x="79" y="36" width="22" height="18" rx="5" fill="#1B1B2F" />
        <path d="M77 124 C86 112 96 112 104 124 C96 137 86 137 77 124Z" fill="#E8739E" opacity=".72" />
        <path d="M46 170 C58 158 68 158 80 170" fill="none" stroke="#E8739E" strokeWidth="2" strokeLinecap="round" opacity=".45" />
        <path d="M100 170 C112 158 122 158 134 170" fill="none" stroke="#E8739E" strokeWidth="2" strokeLinecap="round" opacity=".45" />
      </g>
    </Shell>
  );
}

function Makeup() {
  return (
    <Shell slug="makeup">
      <g>
        <rect x="70" y="70" width="38" height="110" rx="12" fill="#1B1B2F" />
        <rect x="76" y="44" width="26" height="34" rx="8" fill="#E8739E" />
        <rect x="78" y="174" width="22" height="26" rx="6" fill="#D4A248" />
        <circle cx="126" cy="142" r="28" fill="#FFFDF8" stroke="#D4A248" strokeWidth="2" />
        <circle cx="126" cy="142" r="14" fill="#E8739E" opacity=".4" />
        <path d="M40 82 C50 62 68 58 76 70" fill="none" stroke="#E8739E" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      </g>
    </Shell>
  );
}

function HairCare() {
  return (
    <Shell slug="hair-care">
      <g>
        <path d="M22 28 C44 62 32 102 64 132 C94 162 82 198 102 222" stroke="#D4A248" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".88" />
        <path d="M58 18 C78 56 68 96 92 122 C116 148 106 188 128 216" stroke="#EAC986" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".78" />
        <path d="M104 24 C118 56 104 90 128 116 C152 142 142 182 156 216" stroke="#D4A248" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".58" />
        <path d="M122 78 C138 62 154 68 150 84 C147 96 130 96 122 78" fill="#E8739E" opacity=".58" />
        <path d="M36 152 C22 136 18 152 24 162 C30 170 42 167 36 152" fill="#E8739E" opacity=".48" />
      </g>
    </Shell>
  );
}

function FamilyCare() {
  return (
    <Shell slug="family-care">
      <g>
        <circle cx="72" cy="94" r="26" fill="#FFFDF8" stroke="#E8739E" strokeWidth="2" />
        <circle cx="112" cy="86" r="18" fill="#FFFDF8" stroke="#D4A248" strokeWidth="2" />
        <path d="M44 196 C48 154 64 132 90 132 C116 132 132 154 136 196" fill="#E8739E" opacity=".22" />
        <path d="M64 112 C76 124 94 124 106 112" fill="none" stroke="#1B1B2F" strokeWidth="2" strokeLinecap="round" opacity=".45" />
        <path d="M92 83 C96 72 104 68 113 70" fill="none" stroke="#D4A248" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </Shell>
  );
}

function Fallback({ slug }: { slug: string }) {
  const letter = (slug.charAt(0) || '?').toUpperCase();
  return (
    <Shell slug={slug}>
      <text x="90" y="126" textAnchor="middle" dominantBaseline="middle" fontSize="58" fontFamily="Georgia, serif" fill="#E8739E" opacity=".42">
        {letter}
      </text>
    </Shell>
  );
}

export function CategoryIllustration({ slug, uid }: Props) {
  const id = safeId(slug, uid);

  if (/j-beauty|japanese/i.test(slug)) return <JBeauty />;
  if (/k-beauty|korean|skincare-essential/i.test(slug)) return <KBeauty />;
  if (/dry|hydrat|water|hyaluronic/i.test(slug)) return <Hydration id={id} />;
  if (/toner|mist|serum|essence|ampoule/i.test(slug)) return <Toner id={id} />;
  if (/moist|cream|night-cream/i.test(slug)) return <Moisturizer id={id} />;
  if (/sun|spf/i.test(slug)) return <Sunscreen />;
  if (/eye/i.test(slug)) return <EyeCare />;
  if (/mask/i.test(slug)) return <MaskCare />;
  if (/clean|wash|foam/i.test(slug)) return <Cleanser />;
  if (/body|hand|fragrance|hygiene|oil/i.test(slug)) return <BodyCare />;
  if (/makeup|foundation|primer|lips|lip|eyes/i.test(slug)) return <Makeup />;
  if (/hair|shampoo|conditioner/i.test(slug)) return <HairCare />;
  if (/men|baby|mother|mom|diaper|family/i.test(slug)) return <FamilyCare />;

  return <Fallback slug={slug} />;
}
