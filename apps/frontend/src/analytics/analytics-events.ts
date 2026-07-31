import { trackEvent } from './google-tag-manager';

export const analyticsEvents = {
  waitlistSignupStarted: (source: string) =>
    trackEvent({ event: 'waitlist_signup_started', source }),
  waitlistSignupCompleted: (source: string) =>
    trackEvent({ event: 'waitlist_signup_completed', source }),
  loginStarted: () => trackEvent({ event: 'login_started' }),
  loginCompleted: () => trackEvent({ event: 'login_completed' }),
  registrationStarted: () => trackEvent({ event: 'registration_started' }),
  registrationCompleted: () => trackEvent({ event: 'registration_completed' }),
  documentationSearch: (query: string) =>
    trackEvent({
      event: 'documentation_search',
      query_length: query.trim().length,
    }),
  pricingPageViewed: () => trackEvent({ event: 'pricing_page_viewed' }),
  contactFormSubmitted: () => trackEvent({ event: 'contact_form_submitted' }),
} as const;
