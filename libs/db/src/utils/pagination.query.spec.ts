// libs/db/src/utils/pagination.query.spec.ts

import { describe, expect, it } from 'vitest'

import {
  createDatabasePagination,
  createPaginationMeta,
} from './pagination.query'

describe('createDatabasePagination', () => {
  it('creates pagination with the correct offset', () => {
    expect(
      createDatabasePagination({
        page: 3,
        limit: 25,
      }),
    ).toEqual({
      page: 3,
      limit: 25,
      offset: 50,
    })
  })

  it('uses the first page when page is below one', () => {
    expect(
      createDatabasePagination({
        page: 0,
        limit: 25,
      }),
    ).toEqual({
      page: 1,
      limit: 25,
      offset: 0,
    })
  })

  it('rounds fractional page values down', () => {
    expect(
      createDatabasePagination({
        page: 3.9,
        limit: 10,
      }),
    ).toEqual({
      page: 3,
      limit: 10,
      offset: 20,
    })
  })

  it('uses a minimum limit of one', () => {
    expect(
      createDatabasePagination({
        page: 1,
        limit: 0,
      }),
    ).toEqual({
      page: 1,
      limit: 1,
      offset: 0,
    })
  })

  it('rounds fractional limit values down', () => {
    expect(
      createDatabasePagination({
        page: 2,
        limit: 10.9,
      }),
    ).toEqual({
      page: 2,
      limit: 10,
      offset: 10,
    })
  })
})

describe('createPaginationMeta', () => {
  it('creates metadata for a paginated result', () => {
    const pagination = createPaginationMeta({
      page: 2,
      limit: 25,
      total: 60,
    })

    expect(pagination).toMatchObject({
      page: 2,
      limit: 25,
      total: 60,
    })
  })

  it('normalizes invalid page and limit values', () => {
    const pagination = createPaginationMeta({
      page: 0,
      limit: 0,
      total: 10,
    })

    expect(pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 10,
    })
  })

  it('preserves an empty result total', () => {
    const pagination = createPaginationMeta({
      page: 1,
      limit: 25,
      total: 0,
    })

    expect(pagination).toMatchObject({
      page: 1,
      limit: 25,
      total: 0,
    })
  })
})
