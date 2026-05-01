import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { resolveUploadPath } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studioSlug: string; shiftId: string }> }
) {
  const { studioSlug, shiftId } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const studio = await prisma.studio.findUnique({ where: { slug: studioSlug } });
  if (!studio) return new NextResponse("Not found", { status: 404 });

  const member = await prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId: studio.id, userId: user.id } }
  });
  if (!member || member.status !== "APPROVED") return new NextResponse("Forbidden", { status: 403 });

  const shift = await prisma.shift.findFirst({
    where: {
      id: shiftId,
      studioId: studio.id,
      ...(isAdminAccess(member.accessLevel) ? {} : { assignments: { some: { userId: user.id } } })
    }
  });
  if (!shift?.callSheetPath) return new NextResponse("Not found", { status: 404 });

  const file = await readFile(resolveUploadPath(shift.callSheetPath));
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="call-sheet-${shift.id}.pdf"`
    }
  });
}
