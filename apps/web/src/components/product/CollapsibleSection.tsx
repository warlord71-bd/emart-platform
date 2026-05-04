import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface CollapsibleSectionProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  content,
  defaultOpen = false,
}) => {
  if (!content) return null;

  return (
    <details className="group border-b border-gray-200 py-4" open={defaultOpen || undefined}>
      <summary
        className="flex w-full cursor-pointer list-none items-center justify-between text-left font-semibold text-lumiere-text-primary transition-colors hover:text-lumiere-primary [&::-webkit-details-marker]:hidden"
      >
        <span className="text-sm md:text-base">{title}</span>
        <span className="text-xl transition-transform duration-300 group-open:rotate-180">
          ▼
        </span>
      </summary>

      <div className="mt-4 text-sm md:text-base text-lumiere-text-secondary prose prose-sm max-w-none">
        <div
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(content.replace(/\n/g, '<br />')),
          }}
        />
      </div>
    </details>
  );
};
