import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ClientDashboard from "@/components/client-dashboard"
import { SUPABASE_AUTH_COOKIE_NAMES, getAppUserFromAccessToken } from "@/lib/supabase-auth"

async function getUserFromToken() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SUPABASE_AUTH_COOKIE_NAMES.access);
  if (!cookie) return null;

  return getAppUserFromAccessToken(cookie.value);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserFromToken();

  if (!user) {
    redirect('/login');
  }

  return <ClientDashboard user={user} />;
}