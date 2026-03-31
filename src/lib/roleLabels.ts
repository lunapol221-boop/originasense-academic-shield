// Maps internal role keys to user-facing display labels.
// The DB enum value "student" is displayed as "Faculty" in the UI.
const roleDisplayLabels: Record<string, string> = {
  student: "Faculty",
  teacher: "Teacher",
  school_admin: "School Admin",
  super_admin: "Super Admin",
};

export function getRoleLabel(role: string): string {
  return roleDisplayLabels[role] || role.replace("_", " ");
}
