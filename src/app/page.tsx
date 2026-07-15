import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import Reveal from '@/components/Reveal';
import { coverPhotoId, getPublishedPortfolioGalleries } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kristian Buriasco';

export default function HomePage() {
  const galleries = getPublishedPortfolioGalleries();
  const withCovers = galleries.map((g) => ({ gallery: g, cover: coverPhotoId(g) }));
  const hero = withCovers.find((g) => g.cover !== null);

  return (
    <div>
      <SiteHeader />

      {hero ? (
        <section className="relative h-[82vh] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/img/${hero.cover}/web`}
            alt={hero.gallery.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-16 text-center text-white">
            <p className="mb-3 text-[11px] tracking-[0.35em] text-white/70 uppercase">
              Photography
            </p>
            <h1 className="font-serif text-5xl leading-[0.95] font-medium tracking-tight sm:text-6xl md:text-7xl">
              {SITE_NAME}
            </h1>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-6 py-32 text-center">
          <h1 className="font-serif text-6xl font-medium tracking-tight">
            {SITE_NAME}
          </h1>
          <p className="mt-5 text-sm text-muted dark:text-muted-dark">
            Portfolio coming soon.
          </p>
        </section>
      )}

      {withCovers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-10 flex items-baseline justify-between border-b border-line pb-4 dark:border-line-dark">
            <h2 className="font-serif text-2xl font-medium tracking-tight">
              Selected Work
            </h2>
            <span className="text-[11px] tracking-[0.25em] text-muted uppercase dark:text-muted-dark">
              {String(withCovers.length).padStart(2, '0')} projects
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {withCovers.map(({ gallery, cover }, i) => (
              <Reveal key={gallery.id} delay={(i % 3) * 90}>
                <Link href={`/portfolio/${gallery.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-line/60 dark:bg-line-dark/60">
                    {cover && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/img/${cover}/thumb`}
                        alt={gallery.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <p className="font-serif text-lg tracking-tight transition-colors group-hover:text-accent dark:group-hover:text-accent-dark">
                      {gallery.title}
                    </p>
                    <span className="text-[11px] tracking-[0.2em] text-muted tabular-nums dark:text-muted-dark">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
