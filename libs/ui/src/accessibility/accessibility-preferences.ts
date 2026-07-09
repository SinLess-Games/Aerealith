export type ContrastPreference = 'system' | 'more'
export type MotionPreference = 'system' | 'reduce'
export type ReadingPreference = 'default' | 'comfortable'

export interface AccessibilityPreferences {
  contrast: ContrastPreference
  motion: MotionPreference
  reading: ReadingPreference
}

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  contrast: 'system',
  motion: 'system',
  reading: 'default',
}

export const ACCESSIBILITY_STORAGE_KEY = 'aerealith:accessibility'
