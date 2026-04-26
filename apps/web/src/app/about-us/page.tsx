import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: 'About Us',
  description: `${COMPANY.storeName} is an enterprise of ${COMPANY.enterpriseName}, founded by ${COMPANY.founderName} to make authentic global beauty easier to buy in Bangladesh.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">About {COMPANY.storeName}</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted prose-headings:text-ink prose-strong:text-ink prose-li:text-muted">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">Who We Are</h2>
          <p>
            {COMPANY.storeName} is an enterprise of {COMPANY.enterpriseName}, built to make authentic global beauty
            easier to buy in Bangladesh. Founded by {COMPANY.founderName}, Emart combines careful sourcing, local support,
            and practical retail operations from Dhanmondi for customers who want real products without guesswork.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">What We Do</h2>
          <p>
            We focus on authentic skincare, haircare, and beauty products from trusted global brands, then adapt the experience
            for Bangladesh with fast support, payment flexibility, and clear guidance before and after purchase.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">Business Profile</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Founder:</strong> <a href={COMPANY.founderUrl} className="text-accent hover:underline">{COMPANY.founderName}</a></li>
            <li><strong>Enterprise:</strong> {COMPANY.enterpriseName}</li>
            <li><strong>Permanent Team:</strong> {COMPANY.teamSize} employees</li>
            <li><strong>Office:</strong> {COMPANY.office.full}</li>
            <li><strong>Warehouse:</strong> {COMPANY.warehouse.full}</li>
            <li><strong>Support:</strong> <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">Why Customers Choose Emart</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Authenticity First:</strong> We verify products before dispatch instead of relying on claims alone.</li>
            <li><strong>Local Operations:</strong> Office and warehouse coordination are both based in Dhanmondi, Dhaka.</li>
            <li><strong>Reach Across Bangladesh:</strong> We support customers in Dhaka and nationwide with practical delivery options.</li>
            <li><strong>Flexible Payments:</strong> COD, bKash, Nagad, and card options are built for local buying habits.</li>
            <li><strong>Real Support:</strong> Customers can reach an actual local team through phone, email, and WhatsApp.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">Our Mission</h2>
          <p>
            Our goal is simple: make authentic global beauty easier to access, easier to trust, and easier to understand
            for customers in Bangladesh.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-ink">Our Commitment</h2>
          <p>
            We are committed to:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Maintain one clear identity across our store, support, and policies</li>
            <li>Keep customers informed before, during, and after delivery</li>
            <li>Run careful office and warehouse operations from Dhanmondi</li>
            <li>Improve the shopping experience with honest product information</li>
            <li>Build long-term trust, not short-term hype</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
