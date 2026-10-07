import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Stable identity for signed-in users. Returns null when anonymous.
 * Cached per request: the layout and the page both ask.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };
});

/** Use in protected server pages/layouts. */
export async function requireUser(callbackPath = "/account") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return user;
}
