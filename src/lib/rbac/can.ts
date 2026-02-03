export type Role = "owner" | "admin" | "office" | "planner" | "technician" | "viewer";

const roleRank: Record<Role, number> = {
  owner: 5,
  admin: 4,
  office: 3,
  planner: 3,
  technician: 2,
  viewer: 1
};

export function can(role: Role, required: Role | Role[]): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((requiredRole) => roleRank[role] >= roleRank[requiredRole]);
}
