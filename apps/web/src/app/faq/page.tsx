'use client';
import { useState } from 'react';

// Note: In a server component this would be:
// export const metadata: Metadata = { ... };
// But since this uses 'use client', metadata export has moved to page wrapper

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition-colors text-left font-semibold text-[#1a1a2e]"
      >
        {question}
        <span className={`text-[#e8197a] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white text-sm text-gray-600 border-t border-gray-200">
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
      answer: 'Yes, 100% of our products are authentic and sourced directly from manufacturers. We verify every product before shipping.'
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
      answer: 'Yes! Visit us at 17, Central Road (Near Ideal College), Dhanmondi, Dhaka-1205. We\'re open Saturday-Thursday, 9:00 AM – 9:00 PM.'
    },
    {
      question: 'Are there any hidden charges?',
      answer: 'No hidden charges. The price you see is what you pay. Shipping charges are calculated at checkout.'
    },
    {
      question: 'How do I know if a product is right for my skin type?',
      answer: 'Contact our support team for personalized recommendations. We have skincare experts who can guide you based on your skin type and concerns.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-600 text-sm mb-6">Find answers to common questions about Emart, our products, shipping, and more.</p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Still have questions?</strong> Contact us at <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a] hover:underline">emart.bdofficial@gmail.com</a> or call <a href="tel:+8809697597399" className="text-[#e8197a] hover:underline">+880 9697-597399</a>
        </p>
      </div>
    </div>
  );
}
