import { cookies } from "next/headers"
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
  const defaultUser = user || { userId: 'demo', role: 'admin', name: 'Demo User' };

  return <ClientDashboard user={defaultUser} />;
}