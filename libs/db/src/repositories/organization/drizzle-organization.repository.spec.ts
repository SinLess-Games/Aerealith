import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DatabaseClient } from '../../client';
import { DrizzleOrganizationRepository } from './drizzle-organization.repository';

const organizationRow = {
  id: 'organization-1',
  name: 'Aerealith',
  slug: 'aerealith',
  description: null,
  status: 'active',
  createdByUserId: 'user-1',
  metadata: {},
  createdAt: new Date('2026-08-13T10:00:00.000Z'),
  updatedAt: new Date('2026-08-13T10:00:00.000Z'),
  deletedAt: null,
};
const memberRow = {
  id: 'member-1',
  organizationId: 'organization-1',
  userId: 'user-1',
  status: 'active',
  addedByUserId: null,
  joinedAt: new Date('2026-08-13T10:00:00.000Z'),
  createdAt: new Date('2026-08-13T10:00:00.000Z'),
  updatedAt: new Date('2026-08-13T10:00:00.000Z'),
};

function createDatabaseMock() {
  let selectRows: unknown[] = [];
  let insertRows: unknown[] = [];
  let updateRows: unknown[] = [];
  let deleteRows: unknown[] = [];

  const limit = vi.fn(async () => selectRows);
  const orderBy = vi.fn(async () => selectRows);
  const selectWhere = vi.fn(() => ({ limit, orderBy }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn(async () => insertRows);
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const updateReturning = vi.fn(async () => updateRows);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const deleteReturning = vi.fn(async () => deleteRows);
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));
  const deleteMethod = vi.fn(() => ({ where: deleteWhere }));

  const transactionClient = { marker: 'transaction' };
  const transaction = vi.fn(async (work: (tx: unknown) => unknown) =>
    work(transactionClient),
  );

  return {
    database: {
      delete: deleteMethod,
      insert,
      select,
      transaction,
      update,
    } as unknown as DatabaseClient,
    deleteMethod,
    insert,
    insertValues,
    selectFrom,
    setDeleteRows: (rows: unknown[]) => {
      deleteRows = rows;
    },
    setInsertRows: (rows: unknown[]) => {
      insertRows = rows;
    },
    setSelectRows: (rows: unknown[]) => {
      selectRows = rows;
    },
    setUpdateRows: (rows: unknown[]) => {
      updateRows = rows;
    },
    transaction,
    transactionClient,
    update,
    updateSet,
  };
}

describe('DrizzleOrganizationRepository', () => {
  let mock: ReturnType<typeof createDatabaseMock>;
  let repository: DrizzleOrganizationRepository;

  beforeEach(() => {
    mock = createDatabaseMock();
    repository = new DrizzleOrganizationRepository(mock.database);
  });

  it.each([
    ['findActiveById', ['organization-1']],
    ['findActiveBySlug', [' Aerealith ']],
    ['findById', ['organization-1']],
    ['findBySlug', [' Aerealith ']],
  ] as const)(
    'maps organization lookup %s and its missing result',
    async (method, args) => {
      const lookup = repository[method].bind(repository) as (
        ...values: string[]
      ) => Promise<unknown>;
      mock.setSelectRows([organizationRow]);
      await expect(lookup(...args)).resolves.toMatchObject({
        id: 'organization-1',
        slug: 'aerealith',
      });
      mock.setSelectRows([]);
      await expect(lookup(...args)).resolves.toBeNull();
    },
  );

  it.each([
    ['findMemberById', ['member-1']],
    ['findActiveMemberById', ['member-1']],
    ['findMember', ['organization-1', 'user-1']],
    ['findActiveMember', ['organization-1', 'user-1']],
  ] as const)(
    'maps membership lookup %s and its missing result',
    async (method, args) => {
      const lookup = repository[method].bind(repository) as (
        ...values: string[]
      ) => Promise<unknown>;
      mock.setSelectRows([memberRow]);
      await expect(lookup(...args)).resolves.toMatchObject({
        id: 'member-1',
        status: 'active',
      });
      mock.setSelectRows([]);
      await expect(lookup(...args)).resolves.toBeNull();
    },
  );

  it.each([
    ['findMembersByOrganizationId', 'organization-1'],
    ['findActiveMembersByOrganizationId', 'organization-1'],
    ['findMembershipsByUserId', 'user-1'],
    ['findActiveMembershipsByUserId', 'user-1'],
  ] as const)('maps ordered membership list %s', async (method, id) => {
    mock.setSelectRows([memberRow]);
    await expect(repository[method](id)).resolves.toEqual([
      expect.objectContaining({ id: 'member-1' }),
    ]);
  });

  it('creates and maps an organization', async () => {
    mock.setInsertRows([organizationRow]);
    await expect(
      repository.create({
        createdByUserId: 'user-1',
        name: ' Aerealith ',
        slug: ' Aerealith ',
      }),
    ).resolves.toMatchObject({ id: 'organization-1', name: 'Aerealith' });
    expect(mock.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Aerealith', slug: 'aerealith' }),
    );
  });

  it('rejects creation when Drizzle returns no organization', async () => {
    await expect(
      repository.create({ name: 'Aerealith', slug: 'aerealith' }),
    ).rejects.toThrow('Failed to create organization.');
  });

  it('updates organizations, skips empty updates, and handles missing rows', async () => {
    mock.setSelectRows([organizationRow]);
    await expect(
      repository.update('organization-1', {}),
    ).resolves.toMatchObject({
      id: 'organization-1',
    });
    expect(mock.update).not.toHaveBeenCalled();

    mock.setUpdateRows([organizationRow]);
    await expect(
      repository.update('organization-1', { name: ' Updated ' }),
    ).resolves.toMatchObject({ id: 'organization-1' });
    expect(mock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated', updatedAt: expect.any(Date) }),
    );

    mock.setUpdateRows([]);
    await expect(
      repository.update('organization-1', { name: 'Missing' }),
    ).resolves.toBeNull();
  });

  it.each([
    [[{ id: 'organization-1' }], true],
    [[], false],
  ])('soft deletes an organization and returns %s', async (rows, expected) => {
    mock.setUpdateRows(rows);
    await expect(repository.softDelete('organization-1')).resolves.toBe(
      expected,
    );
    expect(mock.updateSet).toHaveBeenCalledWith({
      deletedAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('adds and maps an organization member', async () => {
    mock.setInsertRows([memberRow]);
    await expect(
      repository.addMember({
        organizationId: 'organization-1',
        userId: 'user-1',
      }),
    ).resolves.toMatchObject({ id: 'member-1', status: 'active' });
  });

  it('rejects membership creation when Drizzle returns no row', async () => {
    await expect(
      repository.addMember({
        organizationId: 'organization-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Failed to create organization membership.');
  });

  it('updates, suspends, activates, and skips empty membership updates', async () => {
    mock.setSelectRows([memberRow]);
    await expect(
      repository.updateMember('member-1', {}),
    ).resolves.toMatchObject({
      id: 'member-1',
    });

    mock.setUpdateRows([memberRow]);
    await expect(
      repository.updateMember('member-1', { status: 'active' }),
    ).resolves.toMatchObject({ id: 'member-1' });
    await repository.suspendMember('member-1');
    expect(mock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'suspended' }),
    );
    await repository.activateMember('member-1');
    expect(mock.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
    );

    mock.setUpdateRows([]);
    await expect(
      repository.updateMember('member-1', { status: 'suspended' }),
    ).resolves.toBeNull();
  });

  it.each([
    [[{ id: 'member-1' }], true],
    [[], false],
  ])('removes a membership and returns %s', async (rows, expected) => {
    mock.setDeleteRows(rows);
    await expect(repository.removeMember('member-1')).resolves.toBe(expected);
    expect(mock.deleteMethod).toHaveBeenCalled();
  });

  it('runs work with a repository bound to the database transaction', async () => {
    const work = vi.fn(
      async (transactionRepository: DrizzleOrganizationRepository) =>
        transactionRepository,
    );
    const result = await repository.transaction(work);
    expect(result).toBeInstanceOf(DrizzleOrganizationRepository);
    expect(mock.transaction).toHaveBeenCalled();
    expect(work).toHaveBeenCalledWith(
      expect.any(DrizzleOrganizationRepository),
    );
  });
});
