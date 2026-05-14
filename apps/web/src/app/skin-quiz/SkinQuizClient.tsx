'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Droplet,
  Flame,
  HeartPulse,
  Leaf,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Timer,
  User,
  Wallet,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BUDGET_OPTIONS,
  CONCERN_OPTIONS,
  ENVIRONMENT_OPTIONS,
  ROUTINE_PACE_OPTIONS,
  SKIN_TYPE_OPTIONS,
  buildSkinQuizResult,
  type BudgetBand,
  type RoutinePace,
  type SkinConcern,
  type SkinEnvironment,
  type SkinQuizAnswers,
  type SkinQuizOption,
  type SkinQuizProduct,
  type SkinQuizProductPools,
  type SkinQuizResult,
  type SkinQuizRoutineStep,
  type SkinType,
} from '@/lib/skinQuiz';

type QuizStep = 'skinType' | 'concerns' | 'environment' | 'routinePace' | 'budget' | 'details';
type RoutineTab = 'morning' | 'night' | 'weekly';

const quizSteps: Array<{
  id: QuizStep;
  label: string;
  eyebrow: string;
  title: string;
  helper: string;
  icon: LucideIcon;
}> = [
  {
    id: 'skinType',
    label: 'Skin',
    eyebrow: 'Profile',
    title: 'What does your skin feel like most days?',
    helper: 'Choose the pattern before product, makeup, or sunscreen is applied.',
    icon: HeartPulse,
  },
  {
    id: 'concerns',
    label: 'Goal',
    eyebrow: 'Priority',
    title: 'What should this routine improve first?',
    helper: 'Pick up to 3. The first selected concern becomes the main routine priority.',
    icon: Sparkles,
  },
  {
    id: 'environment',
    label: 'Climate',
    eyebrow: 'Daily setting',
    title: 'What does your day usually look like?',
    helper: 'Humidity, commute, and AC time change how heavy each layer should be.',
    icon: Sun,
  },
  {
    id: 'routinePace',
    label: 'Pace',
    eyebrow: 'Consistency',
    title: 'How much routine can you repeat?',
    helper: 'A routine that survives busy days is better than a perfect routine you skip.',
    icon: Timer,
  },
  {
    id: 'budget',
    label: 'Spend',
    eyebrow: 'Budget',
    title: 'How should product matching balance spend?',
    helper: 'This nudges product picks toward lean, balanced, or best-fit options.',
    icon: Wallet,
  },
  {
    id: 'details',
    label: 'Send',
    eyebrow: 'Delivery',
    title: 'Where should we send your routine?',
    helper: 'You will see the result here immediately, and the same routine can be emailed.',
    icon: Mail,
  },
];

const optionIcons: Partial<Record<SkinType | SkinConcern | SkinEnvironment | RoutinePace | BudgetBand, LucideIcon>> = {
  oily: Droplet,
  combination: Scale,
  dry: Wind,
  sensitive: ShieldCheck,
  normal: Leaf,
  'acne-blemish-care': Flame,
  'pores-oil-control': Droplet,
  'dryness-hydration': Wind,
  melasma: Sun,
  brightening: Sparkles,
  'anti-aging-repair': Clock3,
  'dhaka-heat': Sun,
  'ac-office': Wind,
  'mixed-city': Scale,
  'mostly-indoors': Leaf,
  quick: Timer,
  balanced: CheckCircle2,
  focused: Sparkles,
  starter: Wallet,
  steady: ShoppingBag,
  flexible: Sparkles,
};

const routineTabMeta: Record<RoutineTab, { label: string; icon: LucideIcon }> = {
  morning: { label: 'Morning', icon: Sun },
  night: { label: 'Night', icon: Moon },
  weekly: { label: 'Weekly', icon: Sparkles },
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function stripHtml(value?: string) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function productHref(product: SkinQuizProduct) {
  return `/shop/${product.slug}`;
}

function formatPrice(product: SkinQuizProduct) {
  const raw = product.sale_price || product.price || product.regular_price;
  const price = Number.parseFloat(String(raw || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(price) || price <= 0) return 'View price';
  return `৳${price.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

function OptionCard<T extends string>({
  option,
  selected,
  onClick,
  priorityLabel,
  compact = false,
}: {
  option: SkinQuizOption<T>;
  selected: boolean;
  onClick: () => void;
  priorityLabel?: string;
  compact?: boolean;
}) {
  const Icon = optionIcons[option.value as keyof typeof optionIcons] || Sparkles;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={classNames(
        'w-full rounded-lg border p-3 text-left transition-all sm:p-4',
        compact ? 'min-h-[80px] sm:min-h-[96px]' : 'min-h-[96px] sm:min-h-[118px]',
        selected
          ? 'border-accent bg-white shadow-[0_16px_32px_rgba(212,89,110,0.16)] ring-1 ring-accent/15'
          : 'border-hairline bg-white hover:border-accent/35 hover:bg-accent-soft/35',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={classNames(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border',
            selected ? 'border-accent/25 bg-accent-soft text-accent' : 'border-hairline bg-bg-alt text-ink',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-extrabold text-ink">{option.label}</div>
            {selected ? (
              <CheckCircle2 className="h-5 w-5 text-accent" />
            ) : (
              <Circle className="h-5 w-5 text-muted-2" />
            )}
          </div>
          <div className="mt-2 text-sm leading-6 text-muted">{option.note}</div>
          {priorityLabel && (
            <div className="mt-3 inline-flex rounded-md bg-ink px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              {priorityLabel}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ProductMini({ product }: { product: SkinQuizProduct }) {
  const image = product.images?.[0];

  return (
    <Link
      href={productHref(product)}
      className="group grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-hairline bg-white p-3 transition-colors hover:border-accent/45"
    >
      <span className="relative h-[72px] overflow-hidden rounded-md bg-bg-alt">
        {image?.src ? (
          <Image
            src={image.src}
            alt={image.alt || product.name}
            fill
            sizes="72px"
            className="object-contain p-1.5 transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted">
            <ShoppingBag className="h-5 w-5" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-bold leading-5 text-ink group-hover:text-accent">{stripHtml(product.name)}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold text-accent">{formatPrice(product)}</span>
          {product.on_sale && <span className="rounded-md bg-success-soft px-2 py-1 font-bold text-success">Sale</span>}
        </span>
      </span>
    </Link>
  );
}

function RoutineStepCard({ step, index }: { step: SkinQuizRoutineStep; index: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-ink text-sm font-extrabold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-extrabold text-ink">{step.label}</h4>
            <span className="rounded-md bg-bg-alt px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              {step.cadence}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{step.why}</p>
        </div>
      </div>
      <div className="mt-4">
        {step.product ? (
          <ProductMini product={step.product} />
        ) : (
          <Link
            href={step.href}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Browse this step
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SkinQuizClient({ productPools }: { productPools: SkinQuizProductPools }) {
  const quizTopRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<SkinQuizAnswers>>({
    concerns: [],
  });
  const [lead, setLead] = useState({
    name: '',
    email: '',
    subscribe: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<SkinQuizResult | null>(null);
  const [mailStatus, setMailStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [savedToAccount, setSavedToAccount] = useState(false);
  const [routineTab, setRoutineTab] = useState<RoutineTab>('morning');

  const activeStep = quizSteps[stepIndex];
  const selectedConcerns = answers.concerns || [];
  const concernCount = selectedConcerns.length;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim());

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    quizTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stepIndex]);

  const answerSummary = useMemo(() => {
    const items = [];
    if (answers.skinType) {
      items.push(SKIN_TYPE_OPTIONS.find((option) => option.value === answers.skinType)?.label || '');
    }
    if (selectedConcerns.length > 0) {
      items.push(`${selectedConcerns.length} concern${selectedConcerns.length > 1 ? 's' : ''}`);
    }
    if (answers.environment) {
      items.push(ENVIRONMENT_OPTIONS.find((option) => option.value === answers.environment)?.label || '');
    }
    if (answers.routinePace) {
      items.push(ROUTINE_PACE_OPTIONS.find((option) => option.value === answers.routinePace)?.label || '');
    }
    if (answers.budget) {
      items.push(BUDGET_OPTIONS.find((option) => option.value === answers.budget)?.label || '');
    }
    return items.filter(Boolean);
  }, [answers.budget, answers.environment, answers.routinePace, answers.skinType, selectedConcerns.length]);

  function isStepComplete(stepId: QuizStep) {
    if (stepId === 'skinType') return Boolean(answers.skinType);
    if (stepId === 'concerns') return selectedConcerns.length > 0;
    if (stepId === 'environment') return Boolean(answers.environment);
    if (stepId === 'routinePace') return Boolean(answers.routinePace);
    if (stepId === 'budget') return Boolean(answers.budget);
    if (stepId === 'details') {
      return lead.name.trim().length > 1 && emailIsValid;
    }
    return false;
  }

  function canContinue() {
    return isStepComplete(activeStep.id);
  }

  function canVisitStep(targetIndex: number) {
    return targetIndex <= stepIndex || quizSteps.slice(0, targetIndex).every((step) => isStepComplete(step.id));
  }

  function moveToStep(targetIndex: number) {
    if (!canVisitStep(targetIndex)) return;
    setStepIndex(targetIndex);
  }

  function updateConcern(concern: SkinConcern) {
    setAnswers((current) => {
      const existing = current.concerns || [];
      if (existing.includes(concern)) {
        return { ...current, concerns: existing.filter((item) => item !== concern) };
      }
      if (existing.length >= 3) {
        toast.error('Choose up to 3 concerns');
        return current;
      }
      return { ...current, concerns: [...existing, concern] };
    });
  }

  function moveNext() {
    if (!canContinue()) return;
    setStepIndex((current) => Math.min(current + 1, quizSteps.length - 1));
  }

  function moveBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function submitQuiz() {
    if (!canContinue()) return;

    const completeAnswers: SkinQuizAnswers = {
      skinType: answers.skinType!,
      concerns: selectedConcerns.length > 0 ? selectedConcerns : ['brightening'],
      environment: answers.environment!,
      routinePace: answers.routinePace!,
      budget: answers.budget!,
    };

    const result = buildSkinQuizResult(completeAnswers, productPools);
    setSubmittedResult(result);
    setRoutineTab('morning');
    setSubmitting(true);
    setMailStatus('idle');

    try {
      const response = await fetch('/api/skin-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim().toLowerCase(),
          subscribe: lead.subscribe,
          answers: completeAnswers,
          result,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Could not send your routine email right now.');
      }

      setSavedToAccount(Boolean(data?.savedToAccount));
      setMailStatus('sent');
      toast.success('Routine sent to your email');
    } catch (error: any) {
      console.error('Skin quiz email failed:', error);
      setMailStatus('error');
      toast.error(error?.message || 'We showed your routine here, but email could not be sent.');
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }

  function restartQuiz() {
    setStepIndex(0);
    setAnswers({ concerns: [] });
    setLead({ name: '', email: '', subscribe: false });
    setSubmittedResult(null);
    setMailStatus('idle');
    setSavedToAccount(false);
    setRoutineTab('morning');
  }

  const activeRoutine = submittedResult ? submittedResult[routineTab] : [];

  return (
    <div ref={quizTopRef} className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
          <div className="border-b border-hairline bg-card px-4 py-3 sm:px-5 sm:py-4 md:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent sm:text-xs">{activeStep.eyebrow}</div>
                <h2 className="mt-1 text-lg font-extrabold leading-snug text-ink sm:text-xl md:text-2xl lg:text-3xl">{activeStep.title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-muted sm:text-sm sm:leading-6">{activeStep.helper}</p>
              </div>
              <div className="shrink-0 rounded-lg border border-hairline bg-bg-alt px-3 py-2 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-2">Step</div>
                <div className="text-base font-extrabold text-ink">{stepIndex + 1}<span className="text-xs text-muted">/{quizSteps.length}</span></div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
              {quizSteps.map((step, index) => {
                const Icon = step.icon;
                const complete = isStepComplete(step.id);
                const active = index === stepIndex;
                const enabled = canVisitStep(index);

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => moveToStep(index)}
                    className={classNames(
                      'flex h-9 min-w-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors sm:h-11 sm:gap-2 sm:px-3 sm:text-sm',
                      active && 'border-ink bg-ink text-white',
                      !active && complete && 'border-accent/30 bg-accent-soft text-accent',
                      !active && !complete && 'border-hairline bg-white text-muted',
                      enabled ? 'hover:border-accent hover:text-accent' : 'cursor-not-allowed opacity-55',
                    )}
                    aria-label={step.label}
                  >
                    {complete && !active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    <span className="hidden truncate sm:inline">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-5 sm:py-5 md:px-6 md:py-6">
            {activeStep.id === 'skinType' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SKIN_TYPE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    selected={answers.skinType === option.value}
                    onClick={() => setAnswers((current) => ({ ...current, skinType: option.value }))}
                  />
                ))}
              </div>
            )}

            {activeStep.id === 'concerns' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-hairline bg-bg-alt px-4 py-3">
                  <div className="text-sm font-semibold text-ink">Select up to 3 concerns</div>
                  <div className="text-sm text-muted">{concernCount}/3 selected</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CONCERN_OPTIONS.map((option) => {
                    const selectedIndex = selectedConcerns.indexOf(option.value);

                    return (
                      <OptionCard
                        key={option.value}
                        option={option}
                        selected={selectedIndex >= 0}
                        priorityLabel={selectedIndex >= 0 ? (selectedIndex === 0 ? 'Priority' : `Support ${selectedIndex + 1}`) : undefined}
                        onClick={() => updateConcern(option.value)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {activeStep.id === 'environment' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {ENVIRONMENT_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    selected={answers.environment === option.value}
                    onClick={() => setAnswers((current) => ({ ...current, environment: option.value }))}
                  />
                ))}
              </div>
            )}

            {activeStep.id === 'routinePace' && (
              <div className="grid gap-4 sm:grid-cols-3">
                {ROUTINE_PACE_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    compact
                    selected={answers.routinePace === option.value}
                    onClick={() => setAnswers((current) => ({ ...current, routinePace: option.value }))}
                  />
                ))}
              </div>
            )}

            {activeStep.id === 'budget' && (
              <div className="grid gap-4 sm:grid-cols-3">
                {BUDGET_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    compact
                    selected={answers.budget === option.value}
                    onClick={() => setAnswers((current) => ({ ...current, budget: option.value }))}
                  />
                ))}
              </div>
            )}

            {activeStep.id === 'details' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_320px]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="block text-sm font-semibold text-ink">Your name</span>
                      <span className="relative block">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          value={lead.name}
                          onChange={(event) => setLead((current) => ({ ...current, name: event.target.value }))}
                          className="h-12 w-full rounded-lg border border-hairline bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors focus:border-accent"
                          placeholder="Your name"
                        />
                      </span>
                    </label>
                    <label className="space-y-2">
                      <span className="block text-sm font-semibold text-ink">Email</span>
                      <span className="relative block">
                        <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          type="email"
                          value={lead.email}
                          onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
                          className="h-12 w-full rounded-lg border border-hairline bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors focus:border-accent"
                          placeholder="you@gmail.com"
                        />
                      </span>
                    </label>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-hairline bg-bg-alt px-4 py-4">
                    <input
                      type="checkbox"
                      checked={lead.subscribe}
                      onChange={(event) => setLead((current) => ({ ...current, subscribe: event.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-hairline text-accent focus:ring-accent"
                    />
                    <span className="text-sm leading-6 text-muted">
                      Send routine tips, restock alerts, and offer updates from Emart.
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {answerSummary.map((item) => (
                      <span key={item} className="rounded-md border border-hairline bg-white px-3 py-2 text-xs font-bold text-ink">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-hairline bg-bg-alt p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Mail className="h-4 w-4 text-accent" />
                    Routine delivery
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
                    <p>AM, PM, and weekly steps appear here first.</p>
                    <p>The same routine is emailed for later review.</p>
                    <p>Matching email accounts can store the latest result.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
              <div className="flex flex-wrap gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={moveBack}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-hairline px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
              </div>

              {activeStep.id === 'details' ? (
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={!canContinue() || submitting}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending routine
                    </>
                  ) : (
                    <>
                      Build my routine
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={moveNext}
                  disabled={!canContinue()}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {submittedResult && (
          <section ref={resultRef} className="overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
            <div className="border-b border-hairline bg-ink px-5 py-5 text-white md:px-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-brass">Your match</div>
                  <h2 className="mt-2 text-3xl font-extrabold leading-tight">{submittedResult.headline}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">{submittedResult.summary}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake
                  </button>
                  <Link
                    href={submittedResult.shopHref}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-ink transition-colors hover:bg-bg-alt"
                  >
                    Shop match
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-5 py-6 md:px-6">
              {mailStatus === 'sent' && (
                <div className="rounded-lg border border-success/25 bg-success-soft px-4 py-4 text-sm font-semibold text-success">
                  Your routine has been emailed to {lead.email}.
                </div>
              )}
              {mailStatus === 'error' && (
                <div className="rounded-lg border border-accent/20 bg-accent-soft/50 px-4 py-4 text-sm text-ink">
                  Your quiz is complete, but the email did not send this time. Please retry or use the same email again later so we can deliver it properly.
                </div>
              )}
              {savedToAccount && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-4 text-sm text-ink">
                  This email already matches an Emart customer account, so the latest routine is also saved inside My Account.
                </div>
              )}
              {!savedToAccount && (
                <div className="rounded-lg border border-hairline bg-bg-alt px-4 py-4 text-sm text-muted">
                  When you log in with this same email, we can keep future routines and orders together in My Account.
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-hairline bg-bg-alt p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Profile</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink">{submittedResult.profile.skinType}</span>
                    {submittedResult.profile.concerns.map((concern) => (
                      <span key={concern} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink">
                        {concern}
                      </span>
                    ))}
                    <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink">{submittedResult.profile.environment}</span>
                    <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink">{submittedResult.profile.routinePace}</span>
                    <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink">{submittedResult.profile.budget}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">{submittedResult.routineMatchNote}</p>
                </div>

                <div className="rounded-lg border border-hairline bg-white p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-accent">
                    <Sparkles className="h-4 w-4" />
                    Bangladesh notes
                  </div>
                  <div className="mt-4 space-y-3">
                    {submittedResult.notes.map((note) => (
                      <div key={note} className="rounded-lg border border-hairline bg-bg-alt px-4 py-3 text-sm leading-6 text-muted">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-hairline bg-bg-alt p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Routine plan</div>
                    <h3 className="mt-1 text-lg font-extrabold text-ink">Matched steps and products</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-hairline bg-white p-1">
                    {(Object.keys(routineTabMeta) as RoutineTab[]).map((tab) => {
                      const Icon = routineTabMeta[tab].icon;
                      const count = submittedResult[tab].length;

                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setRoutineTab(tab)}
                          className={classNames(
                            'flex h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-bold transition-colors',
                            routineTab === tab ? 'bg-ink text-white' : 'text-muted hover:bg-bg-alt hover:text-ink',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {routineTabMeta[tab].label}
                          <span className="text-[10px] opacity-75">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {activeRoutine.length > 0 ? (
                    activeRoutine.map((step, index) => <RoutineStepCard key={step.key} step={step} index={index} />)
                  ) : (
                    <div className="rounded-lg border border-hairline bg-white px-4 py-6 text-sm text-muted">
                      No weekly booster is needed for this match. Keep the daily routine consistent first.
                    </div>
                  )}
                </div>
              </div>

              {submittedResult.recommendedProducts.length > 0 && (
                <div className="rounded-lg border border-hairline bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Matched picks</div>
                      <h3 className="mt-1 text-lg font-extrabold text-ink">Products from your routine</h3>
                    </div>
                    <Link href={submittedResult.shopHref} className="hidden text-sm font-bold text-accent hover:underline sm:inline">
                      View more
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {submittedResult.recommendedProducts.slice(0, 4).map((product) => (
                      <ProductMini key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-hairline bg-bg-alt p-5">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">What happens next</div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-white bg-white px-4 py-4">
                    <div className="text-sm font-bold text-ink">1. Open your email</div>
                    <p className="mt-2 text-sm leading-6 text-muted">Your AM and PM routine, notes, and matched picks arrive there first.</p>
                  </div>
                  <div className="rounded-lg border border-white bg-white px-4 py-4">
                    <div className="text-sm font-bold text-ink">2. Use the same email in My Account</div>
                    <p className="mt-2 text-sm leading-6 text-muted">Email login or Continue with Google keeps your orders and routine closer together.</p>
                  </div>
                  <div className="rounded-lg border border-white bg-white px-4 py-4">
                    <div className="text-sm font-bold text-ink">3. Shop when you are ready</div>
                    <p className="mt-2 text-sm leading-6 text-muted">No rush. Review the plan first, then come back when you want to buy.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/account" className="inline-flex h-11 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-black">
                    Go to My Account
                  </Link>
                  <Link href="/shop" className="inline-flex h-11 items-center rounded-lg border border-hairline px-4 text-sm font-bold text-ink transition-colors hover:border-accent hover:text-accent">
                    Browse shop later
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
    </div>
  );
}
