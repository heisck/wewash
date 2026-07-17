import { UserRole } from "@prisma/client";
import { User } from "./config";

/**
 * Define resources in the system.
 */
export type Resource =
  | "machines"
  | "students"
  | "halls"
  | "rooms"
  | "contracts"
  | "payments"
  | "faults"
  | "schedules"
  | "system_config"
  | "notifications"
  | "wash_sessions";

/**
 * Define actions that can be performed on resources.
 */
export type Action = "create" | "read" | "update" | "delete" | "manage";

// Define the shape of permissions
type Permissions = {
  [K in UserRole]: {
    [R in Resource]?: Action[];
  } & {
    "*": Action[]; // Global actions for the role
  };
};

/**
 * Role-Based Access Control (RBAC) matrix.
 */
export const rolePermissions: Permissions = {
  SUPER_ADMIN: {
    "*": ["manage"], // Can do everything
  },
  ADMIN: {
    "*": ["read"],
    machines: ["create", "read", "update", "delete"],
    students: ["create", "read", "update", "delete"],
    halls: ["create", "read", "update", "delete"],
    rooms: ["create", "read", "update", "delete"],
    contracts: ["create", "read", "update", "delete"],
    payments: ["create", "read", "update", "delete"],
    faults: ["create", "read", "update", "delete"],
    schedules: ["create", "read", "update", "delete"],
    system_config: ["read", "update"], // Admins can edit contact/WhatsApp config
    notifications: ["create", "read"],  // Can broadcast notifications
    // Admins can claim a machine for a student (manual scan on behalf).
    wash_sessions: ["create", "read", "update"],
  },
  STUDENT: {
    "*": [],
    machines: ["read"],
    halls: ["read"],
    rooms: ["read"],
    contracts: ["read"],
    // Students submit off-app payment proof (PENDING); admins confirm.
    payments: ["create", "read"],
    faults: ["create", "read", "update"], // Can create and update own faults
    schedules: ["read"],
    wash_sessions: ["create", "read"],    // Can scan (create) and read own sessions
  },
};

/**
 * Check if a user has permission to perform an action on a resource.
 */
export function hasPermission(
  user: User | null | undefined,
  resource: Resource,
  action: Action
): boolean {
  if (!user || !user.isActive) return false;

  const role = user.role as UserRole;
  const permissions = rolePermissions[role];

  if (!permissions) return false;

  // Check global wildcard permission
  if (permissions["*"]?.includes("manage") || permissions["*"]?.includes(action)) {
    return true;
  }

  // Check resource-specific permission
  const resourceActions = permissions[resource];
  if (!resourceActions) return false;

  return resourceActions.includes("manage") || resourceActions.includes(action);
}

/**
 * Require permission or throw an error.
 * Useful in service layer to enforce authorization.
 */
import { AppError } from "@/lib/errors";

export function requirePermission(
  user: User | null | undefined,
  resource: Resource,
  action: Action
): void {
  if (!hasPermission(user, resource, action)) {
    throw AppError.forbidden(`You do not have permission to ${action} ${resource}.`);
  }
}
