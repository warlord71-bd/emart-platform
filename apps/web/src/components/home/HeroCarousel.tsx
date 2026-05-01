import Image from 'next/image';
import Link from 'next/link';

const HERO = {
  eyebrow: 'New brand',
  subtitle: 'AESTURA · dermatologist developed',
  title: 'AESTURA Atobarrier is here',
  mobileCopy: 'Sensitive-skin hydration and barrier support from the Atobarrier line.',
  copy:
    'Sensitive-skin hydration, barrier repair, and everyday comfort from the Atobarrier line.',
  cta: { text: 'Shop AESTURA', href: '/search?q=AESTURA' },
  image: 'https://e-mart.com.bd/wp-content/uploads/2026/02/image.jpeg',
  imageAlt: 'AESTURA Atobarrier spotlight',
};

export const HeroCarousel = () => {
  return (
    <section className="relative bg-bg px-4 pt-1 lg:pt-6">
      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-lg bg-[linear-gradient(135deg,_#dce8ff_0%,_#8fb3ff_52%,_#6f92ea_100%)] min-[0px]:min-h-[284px] lg:min-h-[480px] lg:grid-cols-[1.02fr_0.98fr]">
        <div className="absolute inset-y-0 right-0 hidden w-[56%] bg-[linear-gradient(180deg,_rgba(255,255,255,0.24),_rgba(255,255,255,0))] lg:block" />

        <div className="relative z-10 flex flex-col justify-end px-4 pb-3 pr-3 pt-3 text-white lg:px-10 lg:pb-10 lg:pr-10 lg:pt-10">
          <div className="inline-flex w-fit rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur lg:px-3 lg:text-[11px]">
            {HERO.eyebrow}
          </div>
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/92 lg:mt-4 lg:text-base lg:normal-case lg:tracking-normal">{HERO.subtitle}</div>
          <h1 className="mt-1.5 max-w-[8.5ch] text-[1.45rem] font-extrabold leading-[0.94] text-[#101010] lg:mt-3 lg:max-w-[10ch] lg:text-6xl">
            {HERO.title}
          </h1>
          <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/70 lg:mt-2 lg:text-[11px]">
            Global Beauty. Local Trust.
          </p>
          <p className="mt-1.5 max-w-[28ch] text-[11px] leading-4.5 text-white/92 lg:mt-3 lg:max-w-[46ch] lg:text-base lg:leading-7">
            <span className="lg:hidden">{HERO.mobileCopy}</span>
            <span className="hidden lg:inline">{HERO.copy}</span>
          </p>
          <Link
            href={HERO.cta.href}
            className="mt-2.5 inline-flex w-fit rounded-md bg-ink px-3.5 py-2 text-[13px] font-bold text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-black lg:mt-5 lg:px-5 lg:py-3 lg:text-sm"
          >
            {HERO.cta.text}
          </Link>
        </div>

        <div className="pointer-events-none flex items-end justify-end px-2 pb-3 pt-0 lg:justify-center lg:px-8 lg:pb-8 lg:pt-8">
          <div className="relative -translate-y-2 h-[136px] w-full max-w-[118px] rounded-[18px] bg-white/90 p-2 shadow-[0_14px_24px_rgba(0,0,0,0.12)] backdrop-blur lg:h-[392px] lg:max-w-[420px] lg:translate-y-0 lg:rounded-[28px] lg:p-6">
            <div className="absolute inset-x-5 top-4 h-px bg-gradient-to-r from-transparent via-[#d9d9d9] to-transparent lg:inset-x-6 lg:top-5" />
            <div className="relative h-full w-full">
              <Image
                src={HERO.image}
                alt={HERO.imageAlt}
                fill
                priority
                quality={72}
                sizes="(max-width: 640px) 118px, (max-width: 1024px) 148px, 420px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
