import { auth, currentUser } from '@clerk/nextjs/server';

export interface AuthContext {
  userId: string | null;
  isAdmin: boolean;
  email?: string;
}

// Extract authenticated user and check admin claims
export async function getAuthContext(): Promise<AuthContext> {
  try {
    const session = await auth();
    const user = await currentUser();

    if (!session.userId || !user) {
      return { userId: null, isAdmin: false };
    }

    const email = user.emailAddresses?.[0]?.emailAddress;
    // Check if role is admin via Clerk publicMetadata or predefined admin email
    const metadataRole = (user.publicMetadata as { role?: string })?.role;
    const isAdmin = metadataRole === 'admin' || email === 'admin@naijastreet.com' || email?.includes('admin');

    return {
      userId: session.userId,
      isAdmin,
      email
    };
  } catch (err) {
    return { userId: null, isAdmin: false };
  }
}
