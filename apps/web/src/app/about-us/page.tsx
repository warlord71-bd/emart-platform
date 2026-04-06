import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Emart Bangladesh - your trusted source for authentic Korean and Japanese skincare.',
};

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">About Emart Skincare Bangladesh</h1>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Who We Are</h2>
          <p>
            Emart Skincare Bangladesh is Bangladesh's #1 destination for authentic Korean & Japanese skincare products.
            We are committed to bringing the best K-beauty and J-beauty products directly to your doorstep.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Our Mission</h2>
          <p>
            Our mission is to provide authentic, high-quality Korean and Japanese skincare products to beauty enthusiasts across Bangladesh.
            We believe that everyone deserves access to premium skincare without compromise on quality or authenticity.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Why Choose Emart?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>100% Authentic Products:</strong> Every item is verified genuine and sourced directly from manufacturers.</li>
            <li><strong>Expert Selection:</strong> Our team carefully curates each product for quality and effectiveness.</li>
            <li><strong>Fast Delivery:</strong> Next-day delivery in Dhaka, nationwide shipping available.</li>
            <li><strong>Competitive Prices:</strong> Best prices in Bangladesh for premium K-beauty and J-beauty brands.</li>
            <li><strong>Multiple Payment Options:</strong> bKash, Nagad, and Cash on Delivery (COD) available.</li>
            <li><strong>Customer Support:</strong> Dedicated support team ready to help with any questions.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Popular Brands</h2>
          <p>
            We stock popular brands including COSRX, Meishoku, The Ordinary, Hada Labo, Purito, Isntree,
            TIAM, A'pieu, and many more. Whether you're looking for face masks, serums, toners, or moisturizers,
            we have a wide selection of products for all skin types.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-3">Our Commitment</h2>
          <p>
            We are committed to:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Selling only 100% genuine products</li>
            <li>Providing excellent customer service</li>
            <li>Ensuring fast and safe delivery</li>
            <li>Maintaining competitive and fair pricing</li>
            <li>Building a community of skincare enthusiasts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
