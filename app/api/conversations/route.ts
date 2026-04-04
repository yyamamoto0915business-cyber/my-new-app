import { NextRequest } from "next/server";
import { handlePostCreateConversation } from "@/lib/api/conversations-post";

export async function POST(request: NextRequest) {
  return handlePostCreateConversation(request);
}
