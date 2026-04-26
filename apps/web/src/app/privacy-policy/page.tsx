import type { Metadata } from 'next';
import { COMPANY } from '@/lib/companyProfile';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Emart\'s privacy policy. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink">Privacy Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted prose-headings:text-ink prose-strong:text-ink prose-li:text-muted prose-a:text-accent">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Introduction</h2>
          <p>
            Emart Skincare Bangladesh ("we," "us," or "our") operates the e-mart.com.bd website.
            This Privacy Policy explains how we collect, use, protect, and disclose your information.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Information We Collect</h2>
          <p>We collect information in the following ways:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number, mailing address when you register or place an order</li>
            <li><strong>Payment Information:</strong> Credit/debit card details, bKash, or Nagad account information (handled securely)</li>
            <li><strong>Browsing Information:</strong> Cookies, IP address, browser type, pages visited, and device information</li>
            <li><strong>Communication:</strong> Messages, feedback, and inquiries you send to us</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">How We Use Your Information</h2>
          <p>We use the collected information for:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Processing and delivering your orders</li>
            <li>Sending order confirmations and shipping updates</li>
            <li>Processing refunds and returns</li>
            <li>Responding to your inquiries and customer support</li>
            <li>Personalizing your shopping experience</li>
            <li>Sending marketing emails (you can opt-out anytime)</li>
            <li>Preventing fraud and ensuring website security</li>
            <li>Analytics and improving our services</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Data Protection & Security</h2>
          <p>
            Your information is important to us. We implement industry-standard security measures including:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>SSL/TLS encryption for all data transmission</li>
            <li>Secure payment gateway with PCI compliance</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal information by authorized personnel only</li>
            <li>Password protection for account information</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Cookies & Tracking</h2>
          <p>
            We use cookies to enhance your browsing experience and track website performance.
            Cookies are small files stored on your device that help us remember your preferences
            and improve our website functionality.
          </p>
          <p className="mt-2">
            You can disable cookies in your browser settings, but this may affect some website features.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Third-Party Sharing</h2>
          <p>
            We do not sell or share your personal information with third parties except:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Courier partners for order delivery</li>
            <li>Payment processors for secure transactions</li>
            <li>Service providers who assist us (under confidentiality agreements)</li>
            <li>Legal authorities if required by law</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a readable format</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Children's Privacy</h2>
          <p>
            Our website is not intended for children under 13 years old. We do not knowingly collect
            information from children. If we become aware that we have collected information from a minor,
            we will delete it immediately.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Policy Updates</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page,
            and the effective date will be updated. Your continued use of our website constitutes acceptance
            of the updated Policy.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-success/30 bg-success-soft p-4">
          <p className="text-sm text-ink-2">
            <strong>Privacy Concerns?</strong> Contact us at <a href={`mailto:${COMPANY.supportEmail}`} className="text-accent hover:underline">{COMPANY.supportEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
