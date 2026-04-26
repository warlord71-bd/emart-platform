'use client';
import { useState } from 'react';
import { COMPANY } from '@/lib/companyProfile';

// Note: In a server component this would be:
// export const metadata: Metadata = { ... };
// But since this uses 'use client', metadata export has moved to page wrapper

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-hairline bg-card shadow-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-bg-alt px-4 py-3 text-left font-semibold text-ink transition-colors hover:bg-brass-soft"
      >
        {question}
        <span className={`text-accent transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="border-t border-hairline bg-card px-4 py-3 text-sm text-muted">
          {answer}
        </div>
      )}
    </div>
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
      answer: 'Next-day delivery is available in Dhaka. For other areas, delivery typically takes 2-5 business days depending on location.'
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
      answer: 'Yes, we ship nationwide across Bangladesh. Shipping charges vary by location and order value. Free shipping available on orders above ৳3,000.'
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
    </div>
  );
}
