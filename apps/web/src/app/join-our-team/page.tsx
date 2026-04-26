import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: 'Join Our Team',
  description: `Join ${COMPANY.storeName} and help customers discover authentic beauty products with care.`,
};

const teams = [
  {
    title: 'Customer Care',
    text: 'Help shoppers choose products, understand orders, and feel confident before and after purchase.',
  },
  {
    title: 'Store And Operations',
    text: 'Support receiving, checking, packing, inventory, and daily store coordination with care and accuracy.',
  },
  {
    title: 'Content And Beauty Guidance',
    text: 'Create helpful product education, routine guidance, and beauty content for Bangladeshi customers.',
  },
  {
    title: 'Growth And Partnerships',
    text: 'Work on brand relationships, community campaigns, marketplace growth, and customer experience.',
  },
];

const qualities = [
  'Honest with customers and careful with details',
  'Interested in skincare, beauty, retail, or ecommerce',
  'Comfortable learning product information',
  'Warm, patient, and clear in communication',
  'Ready to work with a fast-moving local team',
];

export default function JoinOurTeamPage() {
  return (
    <main className="bg-bg">
      <section className="border-b border-hairline bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Careers At Emart</p>
          <h1 className="mb-4 text-3xl font-extrabold text-ink md:text-4xl">Join Our Team</h1>
          <p className="max-w-3xl leading-7 text-muted">
            Help customers in Bangladesh discover authentic skincare with confidence. Emart is built by people who care
            about trust, service, and the small details that make a better shopping experience.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team.title} className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
              <h2 className="mb-2 text-lg font-bold text-ink">{team.title}</h2>
              <p className="text-sm leading-6 text-muted">{team.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 px-4 py-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent-soft">Who Fits Well Here</p>
            <h2 className="text-2xl font-bold text-white mb-4">Good Work Starts With Care</h2>
            <p className="leading-7 text-white/72">
              Experience helps, but attitude matters more. The team values people who listen well, learn quickly, and
              treat every customer question with respect.
            </p>
          </div>

          <ul className="space-y-3">
            {qualities.map((quality) => (
              <li key={quality} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-soft" />
                <span>{quality}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-ink">How To Apply</h2>
            <div className="space-y-4 leading-7 text-muted">
              <p>
                Send your CV, the role you are interested in, and a short note about why you want to work with Emart.
                Include any retail, beauty, customer support, content, or ecommerce experience.
              </p>
              <p>
                If there is a current opening that matches your profile, the team will contact you with the next step.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-card p-5 shadow-card">
            <h3 className="mb-3 text-lg font-bold text-ink">Send Your Application</h3>
            <p className="mb-5 text-sm leading-6 text-muted">
              Email your CV or contact the team with your preferred role.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={`mailto:${COMPANY.supportEmail}?subject=Career%20Application%20-%20${COMPANY.brandName}`} className="btn-primary text-center">
                Email CV
              </a>
              <Link href="/contact" className="btn-outline text-center">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
