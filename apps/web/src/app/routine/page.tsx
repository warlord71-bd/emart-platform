import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTINE_STEPS } from '@/lib/routine';
import { absoluteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Korean Skincare Routine Guide | Shop By Step | Emart Bangladesh',
  description: 'Build your perfect skincare routine step by step. Shop authentic Korean skincare for every routine step — Cleanse, Tone, Treat, Moisturise, SPF and more. COD across Bangladesh.',
  alternates: { canonical: absoluteUrl('/routine') },
  robots: { index: true, follow: true },
};

const STEP_COLORS = [
  'bg-pink-50 border-pink-100',
  'bg-sky-50 border-sky-100',
  'bg-blue-50 border-blue-100',
  'bg-violet-50 border-violet-100',
  'bg-teal-50 border-teal-100',
  'bg-green-50 border-green-100',
  'bg-amber-50 border-amber-100',
  'bg-rose-50 border-rose-100',
  'bg-fuchsia-50 border-fuchsia-100',
  'bg-indigo-50 border-indigo-100',
];

export default function RoutineHubPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <div className="border-b border-hairline bg-ink px-4 py-10 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brass">Step-by-step</p>
          <h1 className="text-3xl font-extrabold md:text-4xl">Korean Skincare Routine</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">
            Build your routine from the ground up. Shop authentic products for each step —
            from double cleansing to daily SPF — all available in Bangladesh with COD.
          </p>
        </div>
      </div>

      {/* Steps grid */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROUTINE_STEPS.map((step, i) => (
            <Link
              key={step.slug}
              href={`/routine/${step.slug}`}
              className={`group flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-card ${STEP_COLORS[i % STEP_COLORS.length]}`}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                  {step.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted">
                  Step {step.step}
                </span>
              </div>
              <div className="text-base font-bold text-ink group-hover:text-accent">{step.label}</div>
              <div className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">{step.description}</div>
              <div className="mt-4 text-xs font-semibold text-accent">Shop now →</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
