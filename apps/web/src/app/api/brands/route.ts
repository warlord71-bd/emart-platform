import { getBrands } from '@/lib/woocommerce';

export const revalidate = 3600;

export async function GET() {
  const brands = await getBrands();
  return Response.json(brands);
}
