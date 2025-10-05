import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import ClientDashboard from "@/components/client-dashboard"

async function getUserFromToken() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session_token');
  if (!cookie) return null;

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('NEXTAUTH_SECRET is not defined in the environment variables.');
    }
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(cookie.value, key);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
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