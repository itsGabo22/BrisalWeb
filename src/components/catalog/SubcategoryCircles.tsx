import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';

export interface SubcategoryCirclesProps {
  parentSlug: string;
  subcategories: Category[];
  activeSlug?: string;
}

/**
 * Initials for a subcategory with no image set.
 *
 * Two letters from two words ("Aretes largos" → AL), otherwise the first two
 * of a single word ("Topitos" → TO). Deliberately not an icon: every circle
 * would look identical and the row would read as a loading state.
 */
function initialsFor(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * The subcategory row inside a category page: a circular thumbnail per
 * subcategory with its name beneath.
 *
 * Replaces the pill-shaped text chips this file's predecessor rendered. Routing
 * is byte-for-byte what it was — the same `/catalogo/<parent>/<sub>` href, the
 * same `activeSlug` comparison, the same `aria-current` — because only the
 * presentation was meant to change.
 *
 * A server component on purpose. These are links with no state, so shipping a
 * client bundle for them would buy nothing. The consequence worth naming: a
 * subcategory whose stored `imageUrl` points at a file that has since been
 * deleted renders a broken image rather than falling back, because catching that
 * needs an `onError` handler and therefore a client component. A subcategory
 * with NO image set is handled here and gets initials.
 */
export function SubcategoryCircles({
  parentSlug,
  subcategories,
  activeSlug,
}: SubcategoryCirclesProps) {
  if (subcategories.length === 0) return null;

  return (
    <section className="border-brand-neutral-200/70 bg-brand-pearl border-b px-4 py-5 sm:px-6 lg:px-8">
      <nav
        /*
          Same scroll mechanics as the product carousel and the homepage category
          band: `momentum-scroll-x` for iOS inertia, snap for a controlled swipe,
          scrollbar hidden so the row reads as content rather than as a widget.
          `overflow-x-auto` on this element alone is what keeps a long row from
          becoming page-level horizontal overflow.
        */
        className="momentum-scroll-x mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
        aria-label="Subcategorías"
      >
        {subcategories.map((subcategory) => {
          const isActive = activeSlug === subcategory.slug;

          return (
            <Link
              key={subcategory.id}
              href={`/catalogo/${parentSlug}/${subcategory.slug}`}
              aria-current={isActive ? 'page' : undefined}
              className="group focus-visible:ring-brand-gold flex w-16 shrink-0 snap-start flex-col items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:outline-none sm:w-20"
            >
              <span
                className={cn(
                  'relative block size-16 overflow-hidden rounded-full border transition-all duration-200 sm:size-20',
                  isActive
                    ? 'border-brand-gold ring-brand-gold/45 ring-2 ring-offset-2'
                    : 'border-brand-line group-hover:border-brand-gold/70',
                )}
              >
                {subcategory.imageUrl ? (
                  <Image
                    src={subcategory.imageUrl}
                    alt=""
                    fill
                    // Two fixed sizes only (64px / 80px), so the browser never
                    // needs to fetch anything larger than the circle it fills.
                    sizes="80px"
                    className="object-cover"
                    style={{
                      objectPosition: `${subcategory.imagePosX ?? 50}% ${subcategory.imagePosY ?? 50}%`,
                    }}
                  />
                ) : (
                  <span className="bg-brand-sand text-brand-gold-deep/70 flex h-full w-full items-center justify-center font-body text-sm font-medium tracking-wide">
                    {initialsFor(subcategory.name)}
                  </span>
                )}
              </span>

              <span
                className={cn(
                  // Two lines then ellipsis: "Pulseras ajustables" needs the
                  // second line, and letting it run to three would shunt the
                  // circles out of vertical alignment with each other.
                  'line-clamp-2 text-center font-body text-[11px] leading-snug transition-colors sm:text-xs',
                  isActive
                    ? 'text-brand-gold-deep font-medium'
                    : 'text-brand-text-soft group-hover:text-brand-gold-deep',
                )}
              >
                {subcategory.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
