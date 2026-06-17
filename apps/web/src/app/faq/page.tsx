import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY } from '@/lib/companyProfile';
import { STORE_POLICIES } from '@/config/storePolicies';
import { safeJsonLd } from '@/lib/sanitizeHtml';
import { absoluteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: { absolute: 'FAQ | Emart Skincare Bangladesh' },
  description:
    'Answers about Emart product authenticity, delivery, bKash, Nagad, COD, returns, and skincare shopping support across Bangladesh.',
  alternates: { canonical: 'https://e-mart.com.bd/faq' },
  openGraph: {
    title: 'Frequently Asked Questions — Emart Skincare Bangladesh',
    description:
      'Find answers about delivery, returns, authenticity, and payment at Emart — Bangladesh\'s trusted skincare store.',
    url: 'https://e-mart.com.bd/faq',
    siteName: COMPANY.storeName,
    locale: 'en_BD',
    images: [{ url: absoluteUrl('/wp-content/uploads/2026/03/logo.png'), width: 600, height: 600, alt: 'Emart Skincare Bangladesh' }],
  },
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group mb-3 overflow-hidden rounded-lg border border-hairline bg-card shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between bg-bg-alt px-4 py-3 text-left font-semibold text-ink transition-colors hover:bg-brass-soft [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <span className="text-accent transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="border-t border-hairline bg-card px-4 py-3 text-sm text-muted">
        {answer}
      </div>
    </details>
  );
}

export default function FAQPage() {
  const faqs = [
    {
      question: 'Are all products 100% authentic?',
      answer: 'Yes. We focus on authentic products, verify stock before dispatch, and support customers from our Dhanmondi operation.'
    },
    {
      question: 'How long does delivery take?',
      answer: `${STORE_POLICIES.shipping.dhakaDelivery}. Outside Dhaka, delivery is ${STORE_POLICIES.shipping.outsideDhakaDelivery} depending on location.`
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bKash, Nagad, and Cash on Delivery (COD). Online payment is also available through our secure payment gateway.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer returns/refunds within 7 days if the product is unused and in original packaging. Please visit our Return Policy page for details.'
    },
    {
      question: 'Do you ship outside Dhaka?',
      answer: 'Yes, we ship nationwide across Bangladesh. Shipping charges are confirmed at checkout based on the active delivery settings.'
    },
    {
      question: 'Is there a money-back guarantee?',
      answer: 'If you receive a damaged or defective product, we will replace it or provide a full refund immediately. Your satisfaction is our priority.'
    },
    {
      question: 'How can I track my order?',
      answer: 'You can track your order using a tracking link sent to your email. Visit our Track My Order page to check status anytime.'
    },
    {
      question: 'Do you have a physical store?',
      answer: `Yes. Our office is at ${COMPANY.office.line1}, ${COMPANY.office.line2}, ${COMPANY.office.area}. Our warehouse operates from ${COMPANY.warehouse.line1}, ${COMPANY.warehouse.line2}, ${COMPANY.warehouse.area}.`
    },
    {
      question: 'Are there any hidden charges?',
      answer: 'No hidden charges. The price you see is what you pay. Shipping charges are calculated at checkout.'
    },
    {
      question: 'How do I know if a product is right for my skin type?',
      answer: 'Contact our support team before ordering. We help customers narrow down options based on skin concern, texture preference, and routine type.'
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'FAQ', item: absoluteUrl('/faq') },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />

      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span>/</span>
        <span className="font-medium text-ink">FAQ</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-ink">Frequently Asked Questions</h1>
      <p className="mb-6 text-sm text-muted">Find answers to common questions about Emart, our products, shipping, and more.</p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-brass/30 bg-brass-soft p-4">
        <p className="text-sm text-ink-2">
          <strong>Still have questions?</strong> Contact us at <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a> or call <a href={`tel:${COMPANY.phones.primaryHref}`} className="text-accent hover:underline">{COMPANY.phones.primary}</a>
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-card p-6 text-center shadow-card sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-ink">Ready to shop?</p>
          <p className="mt-1 text-sm text-muted">Browse authentic Korean and global skincare products.</p>
        </div>
        <Link href="/shop" className="shrink-0 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black">
          Shop All Products
        </Link>
      </div>
    </div>
  );
}
