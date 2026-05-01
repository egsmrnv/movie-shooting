import Link from "next/link";
import type { Assignment, Project, ProjectPerson, Shift, User, Vehicle } from "@prisma/client";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { projectPersonRoleLabels, shiftRoleLabels } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type AssignmentWithUser = Assignment & { user: User };
type ProjectPersonWithUser = ProjectPerson & { user: User | null };

export function displayUserName(user: User, memberName?: string | null) {
  return memberName || user.displayName || user.email;
}

export function vehicleLabel(vehicle?: Vehicle | null) {
  if (!vehicle) return "Без машины";
  return `${vehicle.emoji || "🚐"} ${vehicle.title}${vehicle.plate ? ` — ${vehicle.plate}` : ""}`;
}

export function ShiftCard({
  studioSlug,
  shift,
  userId,
  adminLink
}: {
  studioSlug: string;
  shift: Shift & {
    project: Project & { people: ProjectPersonWithUser[] };
    vehicle: Vehicle | null;
    assignments: AssignmentWithUser[];
  };
  userId?: string;
  adminLink?: boolean;
}) {
  const myAssignments = userId ? shift.assignments.filter((assignment) => assignment.userId === userId) : shift.assignments;
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>
            {shift.project.emoji ? `${shift.project.emoji} ` : ""}
            {shift.project.shortTitle || shift.project.title}
          </CardTitle>
          <CardDescription>{formatDate(shift.date)}</CardDescription>
        </div>
        <Badge className="border-primary/30 bg-primary/10 text-red-100">{shift.dayType}</Badge>
      </div>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <div>{vehicleLabel(shift.vehicle)}</div>
        {myAssignments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {myAssignments.map((assignment) => (
              <Badge key={assignment.id}>{shiftRoleLabels[assignment.role]}</Badge>
            ))}
          </div>
        ) : null}
        {shift.note ? <p className="leading-6 text-white/82">{shift.note}</p> : null}
      </div>
      {shift.project.people.length > 0 ? (
        <div className="grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {shift.project.people.map((person) => (
            <div key={person.id}>
              <span className="text-white/80">{projectPersonRoleLabels[person.role]}:</span>{" "}
              {person.user?.displayName || person.name || "Без имени"}
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {shift.callSheetPath ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/api/studios/${studioSlug}/call-sheets/${shift.id}`} target="_blank">
              <FileText className="h-4 w-4" />
              PDF вызывной
            </Link>
          </Button>
        ) : null}
        {adminLink ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/app/${studioSlug}/admin/schedule/${shift.id}`}>Детали смены</Link>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
