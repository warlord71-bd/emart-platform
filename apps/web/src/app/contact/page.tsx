import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Emart Bangladesh. We\'re here to help with any questions about our products or services.',
};

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Contact Form */}
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-4">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e8197a]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e8197a]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Message</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e8197a]" required></textarea>
            </div>
            <button type="submit" className="w-full bg-[#e8197a] text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-4">Get in Touch</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-[#1a1a2e] mb-1">📍 Address</p>
              <p>17, Central Road (Near Ideal College)<br />Dhanmondi, Dhaka-1205<br />Bangladesh</p>
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e] mb-1">📞 Phone</p>
              <p><a href="tel:+8809697597399" className="text-[#e8197a] hover:underline">+880 9697-597399</a></p>
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e] mb-1">✉️ Email</p>
              <p><a href="mailto:emart.bdofficial@gmail.com" className="text-[#e8197a] hover:underline">emart.bdofficial@gmail.com</a></p>
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e] mb-1">🕘 Hours</p>
              <p>Saturday – Thursday: 9:00 AM – 9:00 PM<br />Friday: Closed</p>
            </div>
            <div>
              <p className="font-semibold text-[#1a1a2e] mb-1">💳 Payment Methods</p>
              <p>bKash: <strong>01919-797399</strong><br />Nagad: <strong>01919-797399</strong><br />Cash on Delivery (COD)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
