import {
  CountryValues,
  GenderValues,
  LanguageProficiencyValues,
  Languages,
  ProfileFieldVisibility,
  ProfileFieldVisibilityValues,
  ProfileLinkPlatformValues,
  RomanticOrientationValues,
  SexAttitudeValues,
  SexualityValues,
  SexValues,
  UserProfileFields,
  type Country,
  type Gender,
  type LanguageProficiency,
  type Languages as Language,
  type ProfileFieldVisibility as FieldVisibility,
  type ProfileLinkPlatform,
  type RomanticOrientation,
  type Sex,
  type SexAttitude,
  type Sexuality,
  type UpdateUserProfileContract,
  type UserProfileContract,
  type UserProfileFieldVisibility,
  type UserProfileLanguage,
  type UserProfileLink,
} from '@aerealith-ai/core';
import { useState, type ChangeEvent } from 'react';
import { FiPlus, FiSave, FiTrash2, FiUpload, FiUser } from 'react-icons/fi';

import {
  useProfile,
  useUpdateProfile,
} from '../../../features/auth/use-profile';
import { ApiError } from '../../../lib/api-client';
import styles from './profile.module.css';

type ProfileDraft = {
  handle: string;
  displayName: string;
  givenName: string;
  middleName: string;
  familyName: string;
  pronouns: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  locationLabel: string;
  country: Country | '';
  gender: Gender | '';
  sex: Sex | '';
  sexuality: Sexuality | '';
  romanticOrientation: RomanticOrientation | '';
  sexAttitude: SexAttitude | '';
  languages: UserProfileLanguage[];
  websiteUrl: string;
  links: UserProfileLink[];
  fieldVisibility: UserProfileFieldVisibility;
};

const emptyDraft: ProfileDraft = {
  handle: '',
  displayName: '',
  givenName: '',
  middleName: '',
  familyName: '',
  pronouns: '',
  avatarUrl: '',
  bannerUrl: '',
  bio: '',
  locationLabel: '',
  country: '',
  gender: '',
  sex: '',
  sexuality: '',
  romanticOrientation: '',
  sexAttitude: '',
  languages: [],
  websiteUrl: '',
  links: [],
  fieldVisibility: {},
};

const languageValues = [...new Set(Object.values(Languages))];

export function ProfileRoute() {
  const profile = useProfile();
  const save = useUpdateProfile();
  const [draftState, setDraft] = useState<ProfileDraft>();
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaError, setMediaError] = useState('');

  const draft =
    draftState ?? (profile.data ? toDraft(profile.data) : emptyDraft);

  const updateDraft = (changes: Partial<ProfileDraft>) => {
    setDraft((current) => ({
      ...(current ?? (profile.data ? toDraft(profile.data) : emptyDraft)),
      ...changes,
    }));
    setDirty(true);
    setMessage('');
  };

  const addLanguage = () =>
    updateDraft({
      languages: [
        ...draft.languages,
        { language: 'eng', proficiency: 'unspecified', isPrimary: false },
      ],
    });

  const addLink = () =>
    updateDraft({
      links: [...draft.links, { platform: 'website', url: '', label: null }],
    });

  const onMediaFile = (
    field: 'avatarUrl' | 'bannerUrl',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      setMediaError('Choose a PNG, JPG, or SVG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMediaError('Profile images must be 2 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateDraft({ [field]: String(reader.result) });
      setMediaError('');
    };
    reader.readAsDataURL(file);
  };

  if (profile.isLoading) {
    return <p role="status">Loading your profile…</p>;
  }

  if (profile.isError) {
    return (
      <div role="alert" className={`${styles.panel} p-5`}>
        <p>We couldn’t load your profile.</p>
        <button
          className={`${styles.button} mt-4`}
          onClick={() => profile.refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className={styles.page}>
      <div className="text-sm text-[var(--ae-foreground-muted)]">
        Account{' '}
        <span className="px-2 text-[var(--ae-foreground-subtle)]">›</span>
        <span className="text-[var(--ae-primary)]">Profile</span>
      </div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ae-foreground-muted)]">
            Edit the information shown on your profile and choose who can see
            each field.
          </p>
        </div>
        <span className="rounded-full border border-[var(--ae-accent)] bg-[var(--ae-accent-subtle)] px-3 py-1 text-sm text-[var(--ae-accent)]">
          {formatOption(profile.data?.status ?? 'pending_setup')}
        </span>
      </div>

      {message ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-[var(--ae-success-border)] bg-[var(--ae-success-subtle)] p-3 text-sm text-[var(--ae-success-foreground)]"
        >
          {message}
        </p>
      ) : null}

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(toUpdate(draft), {
            onSuccess: (updated) => {
              setDraft(toDraft(updated));
              setDirty(false);
              setMessage('Your profile has been saved.');
            },
          });
        }}
      >
        <ProfileSection
          title="Identity"
          description="Your public handle and preferred names."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField
              required
              label="Profile handle"
              value={draft.handle}
              onChange={(handle) => updateDraft({ handle })}
            />
            <TextField
              label="Display name"
              value={draft.displayName}
              onChange={(displayName) => updateDraft({ displayName })}
            />
            <TextField
              label="Pronouns"
              value={draft.pronouns}
              onChange={(pronouns) => updateDraft({ pronouns })}
            />
            <TextField
              label="Given name"
              autoComplete="given-name"
              value={draft.givenName}
              onChange={(givenName) => updateDraft({ givenName })}
            />
            <TextField
              label="Middle name"
              autoComplete="additional-name"
              value={draft.middleName}
              onChange={(middleName) => updateDraft({ middleName })}
            />
            <TextField
              label="Family name"
              autoComplete="family-name"
              value={draft.familyName}
              onChange={(familyName) => updateDraft({ familyName })}
            />
          </div>
          <TextArea
            label="Bio"
            maxLength={2000}
            value={draft.bio}
            onChange={(bio) => updateDraft({ bio })}
          />
        </ProfileSection>

        <ProfileSection
          title="Profile media"
          description="Upload an avatar and banner or paste a hosted image URL."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <MediaField
              label="Avatar"
              field="avatarUrl"
              value={draft.avatarUrl}
              previewClassName={styles.preview}
              onChange={(avatarUrl) => updateDraft({ avatarUrl })}
              onFile={onMediaFile}
            />
            <MediaField
              label="Banner"
              field="bannerUrl"
              value={draft.bannerUrl}
              previewClassName={styles.bannerPreview}
              onChange={(bannerUrl) => updateDraft({ bannerUrl })}
              onFile={onMediaFile}
            />
          </div>
          {mediaError ? (
            <p
              role="alert"
              className="text-sm text-[var(--ae-danger-foreground)]"
            >
              {mediaError}
            </p>
          ) : null}
        </ProfileSection>

        <ProfileSection
          title="Location & links"
          description="Add your location, website, and external profiles."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Location"
              autoComplete="address-level2"
              value={draft.locationLabel}
              onChange={(locationLabel) => updateDraft({ locationLabel })}
            />
            <SelectField
              label="Country"
              value={draft.country}
              options={CountryValues}
              emptyLabel="Not set"
              onChange={(country) =>
                updateDraft({ country: country as Country | '' })
              }
            />
            <TextField
              label="Website URL"
              type="url"
              value={draft.websiteUrl}
              onChange={(websiteUrl) => updateDraft({ websiteUrl })}
            />
          </div>
          <CollectionHeader title="External links" onAdd={addLink} />
          <div className="space-y-3">
            {draft.links.map((link, index) => (
              <div
                key={`${index}-${link.platform}`}
                className="grid gap-3 rounded-lg border border-[var(--ae-border)] p-3 md:grid-cols-[.8fr_1.4fr_1fr_auto]"
              >
                <SelectField
                  label={`Link ${index + 1} platform`}
                  visuallyHidden
                  value={link.platform}
                  options={ProfileLinkPlatformValues}
                  onChange={(platform) =>
                    updateLink(draft, updateDraft, index, {
                      platform: platform as ProfileLinkPlatform,
                    })
                  }
                />
                <TextField
                  required
                  label={`Link ${index + 1} URL`}
                  visuallyHidden
                  type="url"
                  value={link.url}
                  onChange={(url) =>
                    updateLink(draft, updateDraft, index, { url })
                  }
                />
                <TextField
                  label={`Link ${index + 1} label`}
                  visuallyHidden
                  value={link.label ?? ''}
                  onChange={(label) =>
                    updateLink(draft, updateDraft, index, {
                      label: nullable(label),
                    })
                  }
                />
                <RemoveButton
                  label={`Remove link ${index + 1}`}
                  onClick={() =>
                    updateDraft({
                      links: draft.links.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                />
              </div>
            ))}
            {draft.links.length === 0 ? (
              <EmptyCollection>
                There are no external links on your profile.
              </EmptyCollection>
            ) : null}
          </div>
        </ProfileSection>

        <ProfileSection
          title="Personal details"
          description="These fields stay private unless you change their visibility below."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="Gender"
              value={draft.gender}
              options={GenderValues}
              emptyLabel="Not set"
              onChange={(gender) =>
                updateDraft({ gender: gender as Gender | '' })
              }
            />
            <SelectField
              label="Sex"
              value={draft.sex}
              options={SexValues}
              emptyLabel="Not set"
              onChange={(sex) => updateDraft({ sex: sex as Sex | '' })}
            />
            <SelectField
              label="Sexuality"
              value={draft.sexuality}
              options={SexualityValues}
              emptyLabel="Not set"
              onChange={(sexuality) =>
                updateDraft({ sexuality: sexuality as Sexuality | '' })
              }
            />
            <SelectField
              label="Romantic orientation"
              value={draft.romanticOrientation}
              options={RomanticOrientationValues}
              emptyLabel="Not set"
              onChange={(romanticOrientation) =>
                updateDraft({
                  romanticOrientation: romanticOrientation as
                    RomanticOrientation | '',
                })
              }
            />
            <SelectField
              label="Sex attitude"
              value={draft.sexAttitude}
              options={SexAttitudeValues}
              emptyLabel="Not set"
              onChange={(sexAttitude) =>
                updateDraft({ sexAttitude: sexAttitude as SexAttitude | '' })
              }
            />
          </div>
        </ProfileSection>

        <ProfileSection
          title="Languages"
          description="List the languages you use and your proficiency."
        >
          <CollectionHeader title="Profile languages" onAdd={addLanguage} />
          <div className="space-y-3">
            {draft.languages.map((language, index) => (
              <div
                key={`${index}-${language.language}`}
                className="grid gap-3 rounded-lg border border-[var(--ae-border)] p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
              >
                <SelectField
                  label={`Language ${index + 1}`}
                  value={language.language}
                  options={languageValues}
                  onChange={(value) =>
                    updateLanguage(draft, updateDraft, index, {
                      language: value as Language,
                    })
                  }
                />
                <SelectField
                  label="Proficiency"
                  value={language.proficiency ?? 'unspecified'}
                  options={LanguageProficiencyValues}
                  onChange={(value) =>
                    updateLanguage(draft, updateDraft, index, {
                      proficiency: value as LanguageProficiency,
                    })
                  }
                />
                <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--ae-foreground-muted)]">
                  <input
                    type="checkbox"
                    checked={language.isPrimary ?? false}
                    onChange={(event) =>
                      updateLanguage(draft, updateDraft, index, {
                        isPrimary: event.target.checked,
                      })
                    }
                  />
                  Primary
                </label>
                <RemoveButton
                  label={`Remove language ${index + 1}`}
                  onClick={() =>
                    updateDraft({
                      languages: draft.languages.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                />
              </div>
            ))}
            {draft.languages.length === 0 ? (
              <EmptyCollection>
                There are no languages on your profile.
              </EmptyCollection>
            ) : null}
          </div>
        </ProfileSection>

        <ProfileSection
          title="Field visibility"
          description="Choose an audience for every profile field."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UserProfileFields.map((field) => (
              <SelectField
                key={field}
                label={formatOption(field)}
                value={
                  draft.fieldVisibility[field] ?? ProfileFieldVisibility.Private
                }
                options={ProfileFieldVisibilityValues}
                onChange={(visibility) =>
                  updateDraft({
                    fieldVisibility: {
                      ...draft.fieldVisibility,
                      [field]: visibility as FieldVisibility,
                    },
                  })
                }
              />
            ))}
          </div>
        </ProfileSection>

        {save.isError ? (
          <p
            role="alert"
            className="rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-4 text-sm text-[var(--ae-danger-foreground)]"
          >
            {save.error instanceof ApiError
              ? save.error.message
              : 'Your profile could not be saved. Please try again.'}
          </p>
        ) : null}

        <div className="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-glass-background-strong)] p-4 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            className={styles.button}
            disabled={!dirty || save.isPending}
            onClick={() => {
              if (profile.data) setDraft(toDraft(profile.data));
              setDirty(false);
              setMessage('');
            }}
          >
            Discard changes
          </button>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={!dirty || save.isPending || Boolean(mediaError)}
          >
            <FiSave aria-hidden="true" />{' '}
            {save.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${styles.panel} space-y-5 p-5 sm:p-6`}>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--ae-foreground-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  autoComplete,
  visuallyHidden = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  visuallyHidden?: boolean;
}) {
  return (
    <label
      className={
        visuallyHidden
          ? 'block'
          : 'block text-sm text-[var(--ae-foreground-muted)]'
      }
    >
      <span className={visuallyHidden ? 'sr-only' : undefined}>{label}</span>
      <input
        className={`${styles.control} ${visuallyHidden ? '' : 'mt-2'}`}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-[var(--ae-foreground-muted)]">
      {label}
      <textarea
        className={`${styles.control} mt-2 min-h-36 resize-y`}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="mt-1 block text-right text-xs text-[var(--ae-foreground-subtle)]">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  visuallyHidden = false,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  visuallyHidden?: boolean;
}) {
  return (
    <label
      className={
        visuallyHidden
          ? 'block'
          : 'block text-sm text-[var(--ae-foreground-muted)]'
      }
    >
      <span className={visuallyHidden ? 'sr-only' : undefined}>{label}</span>
      <select
        className={`${styles.control} ${visuallyHidden ? '' : 'mt-2'}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function MediaField({
  label,
  field,
  value,
  previewClassName,
  onChange,
  onFile,
}: {
  label: string;
  field: 'avatarUrl' | 'bannerUrl';
  value: string;
  previewClassName: string;
  onChange: (value: string) => void;
  onFile: (
    field: 'avatarUrl' | 'bannerUrl',
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
}) {
  return (
    <div className="space-y-3">
      <div className={previewClassName}>
        {value ? (
          <img src={value} alt={`${label} preview`} />
        ) : (
          <span className="grid h-full place-items-center text-2xl text-[var(--ae-accent)]">
            <FiUser aria-hidden="true" />
          </span>
        )}
      </div>
      <TextField label={`${label} URL`} value={value} onChange={onChange} />
      <label className={styles.button}>
        <FiUpload aria-hidden="true" /> Upload {label.toLowerCase()}
        <input
          className="sr-only"
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          onChange={(event) => onFile(field, event)}
        />
      </label>
    </div>
  );
}

function CollectionHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold">{title}</h3>
      <button type="button" className={styles.button} onClick={onAdd}>
        <FiPlus aria-hidden="true" /> Add
      </button>
    </div>
  );
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={styles.removeButton}
      onClick={onClick}
    >
      <FiTrash2 aria-hidden="true" />
    </button>
  );
}

function EmptyCollection({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--ae-border)] p-4 text-sm text-[var(--ae-foreground-muted)]">
      {children}
    </p>
  );
}

function updateLanguage(
  draft: ProfileDraft,
  updateDraft: (changes: Partial<ProfileDraft>) => void,
  index: number,
  changes: Partial<UserProfileLanguage>,
) {
  updateDraft({
    languages: draft.languages.map((language, itemIndex) =>
      itemIndex === index ? { ...language, ...changes } : language,
    ),
  });
}

function updateLink(
  draft: ProfileDraft,
  updateDraft: (changes: Partial<ProfileDraft>) => void,
  index: number,
  changes: Partial<UserProfileLink>,
) {
  updateDraft({
    links: draft.links.map((link, itemIndex) =>
      itemIndex === index ? { ...link, ...changes } : link,
    ),
  });
}

function toDraft(profile: UserProfileContract): ProfileDraft {
  return {
    handle: profile.handle,
    displayName: profile.displayName ?? '',
    givenName: profile.givenName ?? '',
    middleName: profile.middleName ?? '',
    familyName: profile.familyName ?? '',
    pronouns: profile.pronouns ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    bannerUrl: profile.bannerUrl ?? '',
    bio: profile.bio ?? '',
    locationLabel: profile.locationLabel ?? '',
    country: profile.country ?? '',
    gender: profile.gender ?? '',
    sex: profile.sex ?? '',
    sexuality: profile.sexuality ?? '',
    romanticOrientation: profile.romanticOrientation ?? '',
    sexAttitude: profile.sexAttitude ?? '',
    languages: profile.languages.map((language) => ({ ...language })),
    websiteUrl: profile.websiteUrl ?? '',
    links: profile.links.map((link) => ({ ...link })),
    fieldVisibility: { ...profile.fieldVisibility },
  };
}

function toUpdate(draft: ProfileDraft): UpdateUserProfileContract {
  return {
    handle: draft.handle,
    displayName: nullable(draft.displayName),
    givenName: nullable(draft.givenName),
    middleName: nullable(draft.middleName),
    familyName: nullable(draft.familyName),
    pronouns: nullable(draft.pronouns),
    avatarUrl: nullable(draft.avatarUrl),
    bannerUrl: nullable(draft.bannerUrl),
    bio: nullable(draft.bio),
    locationLabel: nullable(draft.locationLabel),
    country: draft.country || null,
    gender: draft.gender || null,
    sex: draft.sex || null,
    sexuality: draft.sexuality || null,
    romanticOrientation: draft.romanticOrientation || null,
    sexAttitude: draft.sexAttitude || null,
    languages: draft.languages,
    websiteUrl: nullable(draft.websiteUrl),
    links: draft.links.map((link) => ({
      ...link,
      label: nullable(link.label ?? ''),
    })),
    fieldVisibility: draft.fieldVisibility,
  };
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function formatOption(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default ProfileRoute;
