import { NextResponse } from "next/server";

export async function proxy() {
  // Temporarily bypassed: always allow access without auth
  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!auth|api|_next|q|favicon.ico|.*\\.).*)"],
};
