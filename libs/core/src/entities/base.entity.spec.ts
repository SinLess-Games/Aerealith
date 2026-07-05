// libs/core/src/entities/base.entity.spec.ts

import { afterEach, describe, expect, it, vi } from 'vitest'

import { BaseEntity, type BaseEntityInput } from './base.entity'

class TestEntity extends BaseEntity {
  constructor(input: BaseEntityInput = {}) {
    super(input)
  }
}

describe('BaseEntity', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates an ID when one is not provided', () => {
    const entity = new TestEntity()

    expect(entity.id).toBeTypeOf('string')
    expect(entity.id.length).toBeGreaterThan(0)
  })

  it('preserves a supplied ID', () => {
    const entity = new TestEntity({
      id: 'entity-id',
    })

    expect(entity.id).toBe('entity-id')
  })

  it('sets createdAt and updatedAt when they are not provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entity = new TestEntity()

    expect(entity.createdAt).toEqual(new Date('2026-06-20T12:00:00.000Z'))
    expect(entity.updatedAt).toEqual(new Date('2026-06-20T12:00:00.000Z'))
  })

  it('preserves supplied timestamps', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z')
    const updatedAt = new Date('2026-06-20T12:30:00.000Z')

    const entity = new TestEntity({
      createdAt,
      updatedAt,
    })

    expect(entity.createdAt).toBe(createdAt)
    expect(entity.updatedAt).toBe(updatedAt)
  })

  it('starts without being deleted', () => {
    const entity = new TestEntity()

    expect(entity.deletedAt).toBeNull()
    expect(entity.isDeleted).toBe(false)
  })

  it('preserves a supplied deleted timestamp', () => {
    const deletedAt = new Date('2026-06-20T12:00:00.000Z')

    const entity = new TestEntity({
      deletedAt,
    })

    expect(entity.deletedAt).toBe(deletedAt)
    expect(entity.isDeleted).toBe(true)
  })

  it('updates updatedAt when touched', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entity = new TestEntity()

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    entity.touch()

    expect(entity.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })

  it('soft deletes the entity', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entity = new TestEntity()

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))

    entity.softDelete()

    expect(entity.isDeleted).toBe(true)
    expect(entity.deletedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
    expect(entity.updatedAt).toEqual(new Date('2026-06-20T12:10:00.000Z'))
  })

  it('restores a soft-deleted entity', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-06-20T12:00:00.000Z'))

    const entity = new TestEntity()

    vi.setSystemTime(new Date('2026-06-20T12:10:00.000Z'))
    entity.softDelete()

    vi.setSystemTime(new Date('2026-06-20T12:20:00.000Z'))
    entity.restore()

    expect(entity.isDeleted).toBe(false)
    expect(entity.deletedAt).toBeNull()
    expect(entity.updatedAt).toEqual(new Date('2026-06-20T12:20:00.000Z'))
  })
})
