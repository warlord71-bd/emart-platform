// Organisms — section-level components; may compose molecules + atoms
// Re-exports from canonical locations; Phase A structural wiring only.

// Navigation / Chrome
export { default as Header } from '@/components/layout/Header';
export { default as Footer } from '@/components/layout/Footer';
export { default as Navigation } from '@/components/layout/Navigation';
export { default as WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
export { default as SignupTabs } from '@/components/layout/SignupTabs';

// Home sections
export { HeroCarousel } from '@/components/home/HeroCarousel';
export { HeroBanner } from '@/components/home/HeroBanner';
export { FlashSaleSection } from '@/components/home/FlashSaleSection';
export { FlashSaleBanner } from '@/components/home/FlashSaleBanner';
export { HomeProductRail } from '@/components/home/HomeProductRail';
export { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
export { TopCategoriesSection } from '@/components/home/TopCategoriesSection';
export { default as ShopByCategory } from '@/components/home/ShopByCategory';
export { ShopByConcern } from '@/components/home/ShopByConcern';
export { BrandsShowcase } from '@/components/home/BrandsShowcase';
export { BrandsCarousel } from '@/components/product/BrandsCarousel';
export { MobileDiscovery } from '@/components/home/MobileDiscovery';
export { SocialChannelGrid } from '@/components/home/SocialChannelGrid';
export { default as WhatsappSignupSection } from '@/components/home/WhatsappSignupSection';
export { AppDownloadBanner } from '@/components/product/AppDownloadBanner';

// PDP sections
export { ProductImage as PdpGallery } from '@/components/product/ProductImage';
export { ProductInfo as PdpBuyPanel } from '@/components/product/ProductInfo';
export { DetailsTabs as TabbedDetails } from '@/components/product/DetailsTabs';
export { ReviewsSection as ReviewsBlock } from '@/components/product/ReviewsSection';
export { MoreProductsFromBrand } from '@/components/product/MoreProductsFromBrand';
export { RelatedProducts } from '@/components/product/RelatedProducts';

// Catalog / shared
export { ProductListGrid as ProductGrid } from '@/components/product/ProductListGrid';
export { default as CatalogFilters } from '@/components/product/CatalogFilters';
export { default as SortControl } from '@/components/product/SortControl';
export { StickyATC } from '@/components/product/StickyATC';
