import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import {
  createShareholder,
  getAdmin,
  getShareholder,
  syncLegacyShareholderOnSignIn,
} from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        // 1. Check if the user exists in the Admin table
        const admin = await getAdmin(user.email);

        if (admin) {
          // Attach data to the user object for the JWT callback to capture
          user.adminId = admin.id;
          user.id = `admin-${admin.id}`;
          return true;
        }

        // 2. Check if the user exists in the Shareholder table
        let shareholder = await getShareholder(user.email);
        let activeShareholderId;

        if (!shareholder) {
          // Auto-create shareholder record if they don't exist
          const newShareholder = await createShareholder({
            email: user.email,
            fullName: user.name,
          });

          activeShareholderId = newShareholder.id;
          user.id = `shareholder-${newShareholder.id}`;
        } else {
          activeShareholderId = shareholder.id;
          user.id = `shareholder-${shareholder.id}`;
        }

        // 3. If this user is an unclaimed legacy shareholder, sync their records automatically
        if (activeShareholderId) {
          await syncLegacyShareholderOnSignIn(activeShareholderId, user.email);
        }

        return true;
      } catch (err) {
        console.error('❌ Sign-in failed:', err);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // The 'user' object is only available on the initial sign-in
      if (user) {
        token.email = user.email;
        token.name = user.name;

        // Persist the adminId into the encrypted JWT
        if (user.adminId) {
          token.adminId = user.adminId;
        }

        // Optional: Keep Google tokens only for admins if needed
        if (user.adminId && account?.access_token) {
          token.accessToken = account.access_token;
          token.scope = account.scope;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name;

      if (token.adminId) {
        // Populate Admin Session
        session.user.adminId = token.adminId;
        session.accessToken = token.accessToken ?? null;
        session.scope = token.scope ?? null;
      } else {
        // Populate Shareholder Session
        const shareholder = await getShareholder(token.email);

        session.user.shareholderId = shareholder?.id;
      }

      return session;
    },

    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // If the token contains an adminId, this is an admin user
      const isAdmin = !!auth?.user?.adminId;

      if (isLoggedIn && isAdmin) {
        // Define which paths the admin is allowed to be on
        const isAllowedPath =
          nextUrl.pathname.startsWith('/admin') ||
          nextUrl.pathname.startsWith('/admin-login') ||
          nextUrl.pathname.startsWith('/welcome') ||
          nextUrl.pathname.startsWith('/api');

        // If the admin is authenticated but trying to access shareholder pages,
        // redirect them to the admin portal.
        if (!isAllowedPath) {
          return Response.redirect(new URL('/admin', nextUrl.url));
        }
      }

      // Allow access to protected routes if logged in
      return isLoggedIn;
    },
  },

  pages: {
    signIn: '/login',
  },

  debug: false,
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig);
