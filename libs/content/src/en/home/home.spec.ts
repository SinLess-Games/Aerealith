import { describe, expect, it } from 'vitest';
import {
  HERO_DATA,
  INVESTOR_VIDEO,
  crowdfundingMediaItems,
  crowdfundingSection,
  differentSection,
  faqCards,
  faqSection,
  homePageContent,
  homeSections,
  infographicCarouselProps,
  pricingPreviewImage,
  pricingPreviewSection,
  productPreviewCarouselProps,
} from '.';

describe('home content', () => {
  it('provides hero and investor content', () => {
    expect(HERO_DATA.title).toBeTruthy();
    expect(HERO_DATA.imageAlt).toBeTruthy();
    expect(INVESTOR_VIDEO.title).toBeTruthy();
  });

  it('provides every composed home section', () => {
    expect(homePageContent.sections).toBe(homeSections);
    expect(crowdfundingSection.videos.length).toBe(
      crowdfundingMediaItems.length,
    );
    expect(differentSection.features.length).toBeGreaterThan(0);
    expect(faqSection.cards).toBe(faqCards);
    expect(pricingPreviewSection.image?.src).toBe(pricingPreviewImage.src);
  });

  it('provides valid carousel timing and discovery configuration', () => {
    expect(infographicCarouselProps.autoScrollInterval).toBeGreaterThan(0);
    expect(productPreviewCarouselProps.maxImages).toBeGreaterThan(0);
  });
});
