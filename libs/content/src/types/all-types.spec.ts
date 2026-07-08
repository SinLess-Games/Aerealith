import { describe, expectTypeOf, it } from 'vitest';

import type {
  AboutSection,
  BackgroundContent,
  CardProps,
  CarouselContent,
  ComponentContent,
  ContactOption,
  ContentCarouselConfig,
  ContentImageItem,
  ContentLink,
  FooterProps,
  ImageContent,
  PageContent,
  PolicyDocument,
  ProfileEditOptions,
  ProfileScaffoldContent,
  VideoContent,
} from '.';

describe('public content types', () => {
  it('exports every reusable content type family', () => {
    expectTypeOf<AboutSection>().toBeObject();
    expectTypeOf<BackgroundContent>().toBeObject();
    expectTypeOf<CardProps>().toBeObject();
    expectTypeOf<CarouselContent>().toBeObject();
    expectTypeOf<ComponentContent>().toBeObject();
    expectTypeOf<ContactOption>().toBeObject();
    expectTypeOf<ContentCarouselConfig>().toBeObject();
    expectTypeOf<ContentImageItem>().toBeObject();
    expectTypeOf<ContentLink>().toBeObject();
    expectTypeOf<FooterProps>().toBeObject();
    expectTypeOf<ImageContent>().toBeObject();
    expectTypeOf<PageContent>().toBeObject();
    expectTypeOf<PolicyDocument>().toBeObject();
    expectTypeOf<ProfileEditOptions>().toBeObject();
    expectTypeOf<ProfileScaffoldContent>().toBeObject();
    expectTypeOf<VideoContent>().toBeObject();
  });
});
