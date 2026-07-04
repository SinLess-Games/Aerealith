// libs/core/src/entities/system/waitlist.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { WaitlistEntity } from './waitlist.entity'

describe('WaitlistEntity', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a waitlist entry with a generated ID', () => {
    const entry = new WaitlistEntity({
      email: 'person@example.com',
    })

    expect(entry.id).toBeTypeOf('string')
    expect(entry.id.length).toBeGreaterThan(0)
  })

  it('preserves a supplied ID and timestamps', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:30:00.000Z')

    const entry = new WaitlistEntity({
      id: 'waitlist-entry-id',
      email: 'person@example.com',
      createdAt,
      updatedAt,
      deletedAt: null,
    })

    expect(entry.id).toBe('waitlist-entry-id')
    expect(entry.createdAt).toBe(createdAt)
    expect(entry.updatedAt).toBe(updatedAt)
    expect(entry.deletedAt).toBeNull()
  })

  it('normalizes email addresses', () => {
    const entry = new WaitlistEntity({
      email: '  Person@Example.COM  ',
    })

    expect(entry.email).toBe('person@example.com')
  })

  it('sets createdAt and updatedAt when they are not supplied', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entry = new WaitlistEntity({
      email: 'person@example.com',
    })

    expect(entry.createdAt).toEqual(new Date('2026-06-20T12:00:00.000Z'))
    expect(entry.updatedAt).toEqual(new Date('2026-06-20T12:00:00.000Z'))
  })

  it('updates and normalizes an email address', () => {
    const entry = new WaitlistEntity({
      email: 'person@example.com',
    })

    entry.updateEmail('  Updated@Example.COM  ')

    expect(entry.email).toBe('updated@example.com')
  })

  it('updates updatedAt when the email address changes', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entry = new WaitlistEntity({
      email: 'person@example.com',
    })

    vi.setSystemTime(new Date('2026-06-20T12:05:00.000Z'))

    entry.updateEmail('updated@example.com')

    expect(entry.updatedAt).toEqual(new Date('2026-06-20T12:05:00.000Z'))
  })

  it('keeps soft-delete behavior from BaseEntity', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entry = new WaitlistEntity({
      email: 'person@example.com',
    })

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    entry.softDelete()

    expect(entry.isDeleted).toBe(true)
    expect(entry.deletedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(entry.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })
})
