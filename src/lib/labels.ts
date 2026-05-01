import { ProjectPersonRole, ShiftRole } from "@prisma/client";
import { projectPersonRoleLabels, shiftRoleLabels } from "@/lib/constants";

export function roleLabel(role: ShiftRole) {
  return shiftRoleLabels[role];
}

export function projectRoleLabel(role: ProjectPersonRole) {
  return projectPersonRoleLabels[role];
}
