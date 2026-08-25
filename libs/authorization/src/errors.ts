export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class AuthorizationDeniedError extends AuthorizationError {
  constructor() {
    super('Forbidden', 'AUTHORIZATION_DENIED');
  }
}
export class AuthorizationUnavailableError extends AuthorizationError {
  constructor() {
    super('Forbidden', 'AUTHORIZATION_UNAVAILABLE');
  }
}
export class PermissionNotFoundError extends AuthorizationError {
  constructor() {
    super('Permission not found.', 'PERMISSION_NOT_FOUND');
  }
}
export class RoleNotFoundError extends AuthorizationError {
  constructor() {
    super('Role not found.', 'ROLE_NOT_FOUND');
  }
}
export class RoleAssignmentConflictError extends AuthorizationError {
  constructor() {
    super(
      'The role assignment conflicts with existing access.',
      'ROLE_ASSIGNMENT_CONFLICT',
    );
  }
}
export class RoleHierarchyCycleError extends AuthorizationError {
  constructor() {
    super('The role hierarchy contains a cycle.', 'ROLE_HIERARCHY_CYCLE');
  }
}
export class ProtectedRoleError extends AuthorizationError {
  constructor() {
    super('The protected role cannot be modified.', 'PROTECTED_ROLE');
  }
}
export class PrivilegeEscalationError extends AuthorizationError {
  constructor() {
    super(
      'The requested change would escalate privileges.',
      'PRIVILEGE_ESCALATION',
    );
  }
}
export class LastAdministratorError extends AuthorizationError {
  constructor() {
    super('The final platform owner cannot be removed.', 'LAST_ADMINISTRATOR');
  }
}
