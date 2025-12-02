// src/utils/roleMapper.ts

export function mapExternalRole(role: string): "student" | "admin" | "superadmin" {
  switch (role) {
    case "ROLE4STUDENT":
    case "ROLE_STUDENT":
    case "student":
      return "student";

    case "ROLE_ADMIN":
    case "admin":
      return "admin";

    case "ROLE_SUPERADMIN":
    case "superadmin":
      return "superadmin";

    default:
      return "student"; // fallback
  }
}
