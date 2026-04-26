'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Mail, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BUDGET_OPTIONS,
  CONCERN_OPTIONS,
  ENVIRONMENT_OPTIONS,
  ROUTINE_PACE_OPTIONS,
  SKIN_TYPE_OPTIONS,
  buildSkinQuizResult,
  type SkinConcern,
  type SkinQuizAnswers,
  type SkinQuizOption,
  type SkinQuizProductPools,
  type SkinQuizResult,
} from '@/lib/skinQuiz';

type QuizStep = 'skinType' | 'concerns' | 'environment' | 'routinePace' | 'budget' | 'details';

const quizSteps: Array<{
  id: QuizStep;
  eyebrow: string;
  title: string;
  helper: string;
}> = [
  {
    id: 'skinType',
    eyebrow: 'Step 1',
    title: 'What does your skin feel like most days?',
    helper: 'Choose the pattern that matches your skin before product is applied.',
  },
  {
    id: 'concerns',
    eyebrow: 'Step 2',
    title: 'What do you want this routine to fix first?',
    helper: 'Pick up to 3 concerns. We will treat the first one as the top priority.',
  },
  {
    id: 'environment',
    eyebrow: 'Step 3',
    title: 'What is your real day-to-day environment?',
    helper: 'This changes how heavy or light your routine should feel in Bangladesh.',
  },
  {
    id: 'routinePace',
    eyebrow: 'Step 4',
    title: 'How much routine can you actually stick to?',
    helper: 'The best routine is the one you will repeat when life gets busy.',
  },
  {
    id: 'budget',
    eyebrow: 'Step 5',
    title: 'How should we balance spend?',
    helper: 'We will use this to lean more affordable or more flexible per step.',
  },
  {
    id: 'details',
    eyebrow: 'Final Step',
    title: 'Where should we send your routine?',
    helper: 'We will also show the result here right away after you submit.',
  },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function OptionCard<T extends string>({
  option,
  selected,
  onClick,
  compact = false,
}: {
  option: SkinQuizOption<T>;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'w-full rounded-lg border p-4 text-left transition-all',
        compact ? 'min-h-[96px]' : 'min-h-[118px]',
        selected
          ? 'border-accent bg-accent-soft shadow-[0_10px_30px_rgba(212,89,110,0.14)]'
          : 'border-hairline bg-white hover:border-accent/35 hover:bg-accent-soft/35',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-2xl leading-none">{option.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-bold text-ink">{option.label}</div>
            {selected ? (
              <CheckCircle2 className="h-5 w-5 text-accent" />
            ) : (
              <Circle className="h-5 w-5 text-muted-2" />
            )}
          </div>
          <div className="mt-2 text-sm leading-6 text-muted">{option.note}</div>
        </div>
      </div>
    </button>
  );
}

export default function SkinQuizClient({ productPools }: { productPools: SkinQuizProductPools }) {
  const resultRef = useRef<HTMLDivElement | null>(null);
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

  const activeStep = quizSteps[stepIndex];
  const selectedConcerns = answers.concerns || [];
  const concernCount = selectedConcerns.length;

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

  function canContinue() {
    const stepId = activeStep.id;
    if (stepId === 'skinType') return Boolean(answers.skinType);
    if (stepId === 'concerns') return selectedConcerns.length > 0;
    if (stepId === 'environment') return Boolean(answers.environment);
    if (stepId === 'routinePace') return Boolean(answers.routinePace);
    if (stepId === 'budget') return Boolean(answers.budget);
    if (stepId === 'details') {
      return lead.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim());
    }
    return false;
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
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
          <div className="border-b border-hairline bg-bg-alt px-5 py-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">{activeStep.eyebrow}</div>
                <h2 className="mt-2 text-2xl font-extrabold text-ink">{activeStep.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{activeStep.helper}</p>
              </div>
              <div className="hidden rounded-lg border border-hairline bg-white px-4 py-3 text-right sm:block">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-2">Progress</div>
                <div className="mt-1 text-lg font-extrabold text-ink">{stepIndex + 1}/{quizSteps.length}</div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${((stepIndex + 1) / quizSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-6 px-5 py-5 md:px-6 md:py-6">
            {activeStep.id === 'skinType' && (
              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-4 md:grid-cols-2">
                  {CONCERN_OPTIONS.map((option) => (
                    <OptionCard
                      key={option.value}
                      option={option}
                      selected={selectedConcerns.includes(option.value)}
                      onClick={() => updateConcern(option.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeStep.id === 'environment' && (
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-3">
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
              <div className="grid gap-4 md:grid-cols-3">
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
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="block text-sm font-semibold text-ink">Your name</span>
                      <input
                        value={lead.name}
                        onChange={(event) => setLead((current) => ({ ...current, name: event.target.value }))}
                        className="h-12 w-full rounded-lg border border-hairline px-4 text-sm text-ink outline-none transition-colors focus:border-accent"
                        placeholder="Hasan"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-sm font-semibold text-ink">Email</span>
                      <input
                        type="email"
                        value={lead.email}
                        onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
                        className="h-12 w-full rounded-lg border border-hairline px-4 text-sm text-ink outline-none transition-colors focus:border-accent"
                        placeholder="you@gmail.com"
                      />
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
                      Also subscribe me for routine tips, restock alerts, and offer updates from Emart.
                    </span>
                  </label>

                  <div className="rounded-lg border border-accent/20 bg-accent-soft/55 px-4 py-4 text-sm leading-6 text-ink">
                    We will email your routine first. If this email already matches your Emart account, we will also save the latest match inside My Account.
                  </div>
                </div>

                <div className="rounded-lg border border-hairline bg-bg-alt p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Mail className="h-4 w-4 text-accent" />
                    What arrives in the email
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
                    <p>Your AM and PM routine in the right order.</p>
                    <p>Product picks matched to your skin and day-to-day environment.</p>
                    <p>Bangladesh-specific notes for humidity, AC, and sunscreen consistency.</p>
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
                  {submitting ? 'Sending routine...' : 'Send my routine'}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
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
                  <div className="text-xs font-bold uppercase tracking-[0.24em] text-brass">Routine sent</div>
                  <h2 className="mt-2 text-3xl font-extrabold leading-tight">Check your inbox for your Emart routine</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
                    We send the routine first so customers can keep the plan private, review it calmly, and return through My Account when ready to shop.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake quiz
                  </button>
                  <Link
                    href="/account"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-ink transition-colors hover:bg-bg-alt"
                  >
                    Open My Account
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

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-hairline bg-white p-5 shadow-card">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">What we use</div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
            <p>Skin type and concern scoring from the quiz.</p>
            <p>Bangladesh-friendly layering logic for humidity, AC, and sun exposure.</p>
            <p>Real Emart catalog products, not just Korean-only matches.</p>
            <p>Budget-aware picking so the routine still feels buyable.</p>
          </div>
        </div>

        <div className="rounded-lg border border-hairline bg-bg-alt p-5">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Before you start</div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
            <p>Add only one new active at a time.</p>
            <p>Patch test if your skin is reactive.</p>
            <p>Sunscreen is the anchor step if dark spots are part of your goal.</p>
          </div>
        </div>

        {answerSummary.length > 0 && (
          <div className="rounded-lg border border-hairline bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Current selections</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {answerSummary.map((item) => (
                <span key={item} className="rounded-full border border-hairline bg-bg-alt px-3 py-2 text-sm font-semibold text-ink">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
