import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { createStudent, getAdmin, getStudent } from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'openid email profile',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  trustHost: true,

  callbacks: {
    async signIn({ user }) {
      try {
        // =========================
        // ADMIN CHECK
        // =========================
        const admin = await getAdmin(user.email);

        if (admin) {
          user.adminId = admin.id;
          user.id = `admin-${admin.id}`;
          return true;
        }

        // =========================
        // STUDENT CHECK
        // =========================
        const student = await getStudent(user.email);

        if (!student) {
          const newStudent = await createStudent({
            email: user.email,
            fullName: user.name,
          });

          user.studentId = newStudent.id;
          user.id = `student-${newStudent.id}`;
        } else {
          user.studentId = student.id;
          user.id = `student-${student.id}`;
        }

        return true;
      } catch (err) {
        console.error('❌ Sign-in failed:', err);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // First login
      if (account && user) {
        token.email = user.email;
        token.name = user.name;

        // Preserve identities
        if (user.adminId) token.adminId = user.adminId;
        if (user.studentId) token.studentId = user.studentId;

        // Admin-only Google access token
        if (user.adminId && account.access_token) {
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
        session.user.adminId = token.adminId;
        session.accessToken = token.accessToken ?? null;
        session.scope = token.scope ?? null;
      } else {
        // No DB call — rely on JWT
        session.user.studentId = token.studentId;
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig);
