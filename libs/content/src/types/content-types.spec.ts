import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  CarouselContent,
  CarouselSection,
  ComponentContent,
  PageContent,
  PageSection,
} from '.';

interface FeatureProps {
  readonly featureId: string;
  readonly compact?: boolean;
}

describe('content types', () => {
  it('compose reusable, serializable page content', () => {
    const carousel = {
      autoScroll: true,
      autoScrollInterval: 4_000,
      items: [
        { type: 'image', src: '/hero.webp', alt: 'Aerealith dashboard' },
        {
          type: 'component',
          component: 'feature-card',
          props: { featureId: 'automation', compact: true },
        },
        {
          type: 'presentation',
          label: 'Product tour',
          autoPlay: true,
          slideTime: 3_000,
          slides: [{ src: '/tour/slide-1.webp', alt: 'Product overview' }],
        },
      ],
    } as const satisfies CarouselContent<FeatureProps>;

    const carouselSection: CarouselSection<FeatureProps> = {
      id: 'product-tour',
      type: 'carousel',
      title: 'See it in action',
      content: carousel,
    };

    const page = {
      slug: 'home',
      metadata: { title: 'Aerealith', description: 'A private AI platform.' },
      sections: [carouselSection],
    } as const satisfies PageContent;

    expect(page.sections[0].content.items).toHaveLength(3);
    expectTypeOf(carousel.items[1]).toMatchTypeOf<
      ComponentContent<FeatureProps>
    >();
  });

  it('allows pages to narrow their section union', () => {
    type MarketingSection =
      | CarouselSection<FeatureProps>
      | (PageSection<{ readonly body: string }> & { readonly type: 'copy' });

    expectTypeOf<PageContent<MarketingSection>['sections']>().toEqualTypeOf<
      readonly MarketingSection[]
    >();
  });
});
