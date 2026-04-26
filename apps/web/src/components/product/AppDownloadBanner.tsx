'use client';

export function AppDownloadBanner() {
  return (
    <div className="rounded-2xl border border-hairline bg-gradient-to-br from-[#eef7f2] via-white to-[#fff4f7] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Mobile app</p>
          <h3 className="mt-1 text-lg font-bold text-ink">Shop faster on the Emart app</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Track orders, reorder essentials, and browse new arrivals from your phone.
          </p>
        </div>
        <span className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
          App coming soon (iOS & Android)
        </span>
      </div>
    </div>
  );
}

export default AppDownloadBanner;
