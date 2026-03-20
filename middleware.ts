import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware()

// Protect routes (and enable Clerk to handle its auth endpoints)
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}

