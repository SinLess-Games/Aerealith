import { describe, expect, it } from 'vitest'

import {
  AppEnvironment,
  AuthErrorCode,
  CommonErrorCode,
  ContentMaturity,
  Country,
  DatabaseErrorCode,
  DateFormat,
  Gender,
  HttpErrorCodeValues,
  HttpMethod,
  HttpStatus,
  LanguageProficiency,
  Languages,
  MeasurementSystem,
  NameDisplayOrder,
  ProfileFieldVisibility,
  ProfileLinkPlatform,
  ProfileModuleStatus,
  ProfileResourceVisibility,
  ProfileReview,
  ProfileStatus,
  RomanticOrientation,
  Sex,
  SexAttitude,
  Sexuality,
  TimeFormat,
  TimezoneGreenwich,
  TimezoneUtc,
  UserReportType,
  UserRole,
  UserStatus,
  UserTier,
  WeekStartDay,
  isAppEnvironment,
  isAuthErrorCode,
  isCommonErrorCode,
  isContentMaturity,
  isCountry,
  isDatabaseErrorCode,
  isDateFormat,
  isGender,
  isHttpErrorCode,
  isHttpMethod,
  isHttpStatus,
  isLanguage,
  isLanguageProficiency,
  isMeasurementSystem,
  isNameDisplayOrder,
  isProfileFieldVisibility,
  isProfileLinkPlatform,
  isProfileModuleStatus,
  isProfileResourceVisibility,
  isProfileReview,
  isProfileStatus,
  isRomanticOrientation,
  isSex,
  isSexAttitude,
  isSexuality,
  isTimeFormat,
  isTimezoneGreenwich,
  isTimezoneUtc,
  isUserReportType,
  isUserRole,
  isUserStatus,
  isUserTier,
  isWeekStartDay,
} from './index'

type EnumValues = Readonly<Record<string, string | number>>
type EnumGuard = (value: unknown) => boolean

const guardCases: ReadonlyArray<readonly [string, EnumValues, EnumGuard]> = [
  ['AppEnvironment', AppEnvironment, isAppEnvironment],
  ['AuthErrorCode', AuthErrorCode, isAuthErrorCode],
  ['CommonErrorCode', CommonErrorCode, isCommonErrorCode],
  ['ContentMaturity', ContentMaturity, isContentMaturity],
  ['Country', Country, isCountry],
  ['DatabaseErrorCode', DatabaseErrorCode, isDatabaseErrorCode],
  ['DateFormat', DateFormat, isDateFormat],
  ['Gender', Gender, isGender],
  ['HttpErrorCode', { code: HttpErrorCodeValues[0] }, isHttpErrorCode],
  ['HttpMethod', HttpMethod, isHttpMethod],
  ['HttpStatus', HttpStatus, isHttpStatus],
  ['LanguageProficiency', LanguageProficiency, isLanguageProficiency],
  ['Languages', Languages, isLanguage],
  ['MeasurementSystem', MeasurementSystem, isMeasurementSystem],
  ['NameDisplayOrder', NameDisplayOrder, isNameDisplayOrder],
  ['ProfileFieldVisibility', ProfileFieldVisibility, isProfileFieldVisibility],
  ['ProfileLinkPlatform', ProfileLinkPlatform, isProfileLinkPlatform],
  ['ProfileModuleStatus', ProfileModuleStatus, isProfileModuleStatus],
  [
    'ProfileResourceVisibility',
    ProfileResourceVisibility,
    isProfileResourceVisibility,
  ],
  ['ProfileReview', ProfileReview, isProfileReview],
  ['ProfileStatus', ProfileStatus, isProfileStatus],
  ['RomanticOrientation', RomanticOrientation, isRomanticOrientation],
  ['Sex', Sex, isSex],
  ['SexAttitude', SexAttitude, isSexAttitude],
  ['Sexuality', Sexuality, isSexuality],
  ['TimeFormat', TimeFormat, isTimeFormat],
  ['TimezoneGreenwich', TimezoneGreenwich, isTimezoneGreenwich],
  ['TimezoneUtc', TimezoneUtc, isTimezoneUtc],
  ['UserReportType', UserReportType, isUserReportType],
  ['UserRole', UserRole, isUserRole],
  ['UserStatus', UserStatus, isUserStatus],
  ['UserTier', UserTier, isUserTier],
  ['WeekStartDay', WeekStartDay, isWeekStartDay],
]

describe.each(guardCases)('%s guard', (_name, values, guard) => {
  const validValue = Object.values(values)[0]

  it('accepts a declared value', () => {
    expect(validValue).toBeDefined()
    expect(guard(validValue)).toBe(true)
  })

  it('rejects an undeclared value of the expected primitive type', () => {
    const invalidValue =
      typeof validValue === 'number' ? Number.MAX_SAFE_INTEGER : '__invalid__'

    expect(guard(invalidValue)).toBe(false)
  })

  it('rejects a value of another type', () => {
    expect(guard({})).toBe(false)
  })
})
