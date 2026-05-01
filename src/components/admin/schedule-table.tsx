import Link from "next/link";
import type { Assignment, Project, Shift, User, Vehicle } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { shiftRoleLabels } from "@/lib/constants";
import { formatShortDate } from "@/lib/utils";

type ShiftRowData = Shift & {
  project: Project;
  vehicle: Vehicle | null;
  assignments: (Assignment & { user: User })[];
};

export function CompactShiftRow({ shift, studioSlug }: { shift: ShiftRowData; studioSlug: string }) {
  return (
    <tr className="border-b border-border align-top">
      <td className="whitespace-nowrap px-3 py-3 text-sm text-white">{formatShortDate(shift.date)}</td>
      <td className="min-w-48 px-3 py-3 text-sm text-white">
        {shift.project.emoji ? `${shift.project.emoji} ` : ""}
        {shift.project.shortTitle || shift.project.title}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm text-muted-foreground">{shift.dayType}</td>
      <td className="min-w-52 px-3 py-3 text-sm text-muted-foreground">
        {shift.vehicle ? `${shift.vehicle.emoji || "🚐"} ${shift.vehicle.title} ${shift.vehicle.plate || ""}` : "Нет"}
      </td>
      <td className="min-w-72 px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {shift.assignments.map((assignment) => (
            <Badge key={assignment.id}>
              {assignment.user.displayName} · {shiftRoleLabels[assignment.role]}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        {shift.callSheetPath ? (
          <Link className="text-primary hover:text-red-300" href={`/api/studios/${studioSlug}/call-sheets/${shift.id}`} target="_blank">
            PDF
          </Link>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="min-w-56 px-3 py-3 text-sm text-muted-foreground">{shift.note || "—"}</td>
    </tr>
  );
}
