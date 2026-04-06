import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Emart Skincare Bangladesh Terms & Conditions. Read our terms of service and user agreement.',
};

export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Terms & Conditions</h1>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using this website (e-mart.com.bd), you accept and agree to be bound by the terms,
            conditions, and notices contained herein. If you do not agree to abide by the above, please do not use this service.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information, software, documents)
            from Emart Skincare Bangladesh for personal, non-commercial transitory viewing only.
            This is the grant of a license, not a transfer of title. Under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Modify, copy, or distribute the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to reverse engineer, disassemble, or hack into the website</li>
            <li>Transfer the materials to another person or "mirror" on any other server</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">3. Disclaimer of Warranties</h2>
          <p>
            The materials on Emart Skincare Bangladesh are provided on an "as is" basis.
            We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties
            including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose,
            or non-infringement of intellectual property or other violation of rights.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">4. Limitations of Liability</h2>
          <p>
            In no event shall Emart Skincare Bangladesh or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials
            on Emart Skincare Bangladesh, even if we have been notified of the possibility of such damage.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Emart Skincare Bangladesh could include technical inaccuracies or typographical errors.
            We do not warrant that any of the materials on our website are accurate, complete, or current.
            We may make changes to the materials contained on our website at any time without notice.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">6. Materials & Content Ownership</h2>
          <p>
            The materials on Emart Skincare Bangladesh are protected by copyright and trademark laws.
            You may not modify, copy, reproduce, republish, upload, post, transmit, or distribute these materials
            in any way without our written permission.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">7. Product Information</h2>
          <p>
            We strive to provide accurate product descriptions and pricing. However,
            we do not warrant that product descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free.
            If a product offered by Emart is not as described, your sole remedy is to return it in unused condition.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">8. Order Acceptance</h2>
          <p>
            We reserve the right to refuse any order you place with us.
            We may, in our sole discretion, limit or cancel quantities purchased per person, per household,
            or per order. All purchase orders are subject to acceptance and confirmation of availability and price.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">9. Pricing & Availability</h2>
          <p>
            We reserve the right to change our prices without notice and without liability.
            While we attempt to provide accurate information, errors may occur.
            If a product's actual price is lower than the stated price, we will charge the lower amount.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">10. User Conduct</h2>
          <p>
            You agree not to use this website:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>To harass, abuse, or threaten others</li>
            <li>To post inappropriate or offensive content</li>
            <li>To attempt unauthorized access or hacking</li>
            <li>To transmit viruses, spyware, or malicious code</li>
            <li>To spam or engage in fraudulent activity</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">11. Account Responsibility</h2>
          <p>
            If you create an account on our website, you are responsible for maintaining the confidentiality of your password
            and account information. You agree to accept responsibility for all activities that occur under your account.
            You must notify us immediately of any unauthorized use of your account.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">12. Changes to Terms</h2>
          <p>
            We may revise these terms of service for Emart Skincare Bangladesh at any time without notice.
            By using this website after such modifications, you agree to be bound by the revised terms and conditions.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-3">13. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of Bangladesh,
            and you irrevocably submit to the exclusive jurisdiction of the courts located in Dhaka, Bangladesh.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-yellow-900">
            <strong>Last Updated:</strong> March 2026<br />
            <strong>Questions?</strong> Contact us at <a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a] hover:underline">emart.bdofficial@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
