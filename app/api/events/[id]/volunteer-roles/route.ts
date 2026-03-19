import { NextResponse } from "next/server";
import { getVolunteerRolesByEvent } from "@/lib/volunteer-roles-mock";
import { getCreatedVolunteerRolesByEvent } from "@/lib/created-volunteer-roles-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id: eventId } = await params;
  const isProduction = process.env.NODE_ENV === "production";
  const roles = [
    ...(isProduction ? [] : getVolunteerRolesByEvent(eventId)),
    ...getCreatedVolunteerRolesByEvent(eventId),
  ];
  return NextResponse.json(roles);
}
