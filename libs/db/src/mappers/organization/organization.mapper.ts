// libs/db/src/mappers/organization/organization.mapper.ts

import {
  OrganizationStatus,
  type NewOrganizationRow,
  type OrganizationRow,
  type OrganizationStatus as OrganizationStatusType,
} from '../../schema/organization/organization.table';

/**
 * Persistence-neutral representation of an organization.
 *
 * Repositories may return this shape without exposing Drizzle-specific row
 * types to callers.
 *
 * Once the organization domain library owns an OrganizationEntity, this
 * mapper can construct that entity instead without changing persistence
 * semantics.
 */
export interface OrganizationRecord {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly status: OrganizationStatusType;
  readonly createdByUserId?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}

/**
 * Input used when creating an organization.
 *
 * Ownership is intentionally NOT represented here.
 *
 * Organization ownership is established through:
 *
 *   organization_members
 *        ↓
 *   organization_member_roles
 *        ↓
 *   owner role
 *
 * createdByUserId is provenance/audit data only.
 */
export interface CreateOrganizationRecord {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly status?: OrganizationStatusType;
  readonly createdByUserId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Mutable organization fields supported by persistence.
 */
export interface UpdateOrganizationRecord {
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string | null;
  readonly status?: OrganizationStatusType;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Converts a database organization row into a persistence-neutral
 * organization record.
 */
export function toOrganizationRecord(row: OrganizationRow): OrganizationRecord {
  return {
    id: row.id,

    name: row.name,

    slug: row.slug,

    ...(row.description !== null
      ? {
          description: row.description,
        }
      : {}),

    status: toOrganizationStatus(row.status),

    ...(row.createdByUserId !== null
      ? {
          createdByUserId: row.createdByUserId,
        }
      : {}),

    metadata: { ...row.metadata },

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,

    ...(row.deletedAt !== null
      ? {
          deletedAt: row.deletedAt,
        }
      : {}),
  };
}

/**
 * Converts organization creation input into a database insert row.
 *
 * Database-generated values such as ID and timestamps are intentionally
 * omitted.
 */
export function toNewOrganizationRow(
  input: CreateOrganizationRecord,
): NewOrganizationRow {
  return {
    name: normalizeOrganizationName(input.name),

    slug: normalizeOrganizationSlug(input.slug),

    ...(input.description !== undefined
      ? {
          description: normalizeOptionalDescription(input.description),
        }
      : {}),

    status: input.status ?? OrganizationStatus.Active,

    ...(input.createdByUserId !== undefined
      ? {
          createdByUserId: input.createdByUserId,
        }
      : {}),

    metadata: input.metadata ? { ...input.metadata } : {},
  };
}

/**
 * Converts a partial organization mutation into fields suitable for a
 * Drizzle update.
 *
 * updatedAt is intentionally excluded. Repositories should attach mutation
 * timestamps when performing the update.
 *
 * A null description explicitly clears the stored description.
 */
export function toOrganizationUpdateRow(
  input: UpdateOrganizationRecord,
): Partial<
  Pick<
    NewOrganizationRow,
    'name' | 'slug' | 'description' | 'status' | 'metadata'
  >
> {
  const values: Partial<
    Pick<
      NewOrganizationRow,
      'name' | 'slug' | 'description' | 'status' | 'metadata'
    >
  > = {};

  if (input.name !== undefined) {
    values.name = normalizeOrganizationName(input.name);
  }

  if (input.slug !== undefined) {
    values.slug = normalizeOrganizationSlug(input.slug);
  }

  if (input.description !== undefined) {
    values.description =
      input.description === null
        ? null
        : normalizeOptionalDescription(input.description);
  }

  if (input.status !== undefined) {
    values.status = input.status;
  }

  if (input.metadata !== undefined) {
    values.metadata = {
      ...input.metadata,
    };
  }

  return values;
}

/**
 * Normalizes the canonical organization slug.
 *
 * Examples:
 *
 *   "SinLess Games"
 *       -> "sinless-games"
 *
 *   " Aerealith_AI "
 *       -> "aerealith-ai"
 */
export function normalizeOrganizationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Organization names are presentation-oriented, so their casing is
 * preserved.
 */
function normalizeOrganizationName(value: string): string {
  return value.trim();
}

/**
 * Empty descriptions are normalized to null rather than storing meaningless
 * whitespace.
 */
function normalizeOptionalDescription(value: string): string | null {
  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

/**
 * Validates an organization status read from persistence.
 *
 * This fails closed if invalid database state somehow bypasses the schema
 * constraint.
 */
function toOrganizationStatus(value: string): OrganizationStatusType {
  const values = Object.values(OrganizationStatus);

  if (values.includes(value as OrganizationStatusType)) {
    return value as OrganizationStatusType;
  }

  throw new Error(`Invalid organization status in database: ${value}`);
}
