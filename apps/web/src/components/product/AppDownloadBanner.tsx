export const AppDownloadBanner = () => {
  return (
    <div className="w-full bg-green-100 border border-green-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:bg-green-200 transition-colors">
      <span className="text-lg md:text-xl flex-shrink-0">🔽</span>
      <a
        href="#"
        className="text-green-700 hover:text-green-900 font-semibold text-sm md:text-base whitespace-nowrap"
      >
        Download App for Exclusive Deals & Offers
      </a>
    </div>
  );
};
