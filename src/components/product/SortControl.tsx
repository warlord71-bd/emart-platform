'use client';
import { useRouter, useSearchParams } from 'next/navigation';

interface SortControlProps {
  currentOrderby?: string;
  currentOrder?: string;
}

export default function SortControl({ currentOrderby = 'date', currentOrder = 'desc' }: SortControlProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const [orderby, order] = value.split('-');
    const params = new URLSearchParams(searchParams);
    params.set('orderby', orderby);
    params.set('order', order);
    params.delete('page');
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <select
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:border-[#e8197a] cursor-pointer"
      defaultValue={`${currentOrderby}-${currentOrder}`}
      onChange={(e) => handleSort(e.target.value)}
    >
      <option value="date-desc">Latest</option>
      <option value="popularity-desc">Most Popular</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="rating-desc">Top Rated</option>
    </select>
  );
}
