import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { createStudent, getAdmin, getStudent } from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,

      // ✅ FIX: Add the required calendar scope here
      authorization: {
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
        params: {
          scope:
            'openid email profile',
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        // CHECK ADMIN
        const admin = await getAdmin(user.email);
        if (admin) {
          user.adminId = admin.id;
          user.id = `admin-${admin.id}`;

          return true;
        }

        // CHECK STUDENT
        const student = await getStudent(user.email);

        if (!student) {
          const newStudent = await createStudent({
            email: user.email,
            fullName: user.name,
          });

          user.id = `student-${newStudent.id}`;
        } else {
          user.id = `student-${student.id}`;
        }

        return true;
      } catch (err) {
        console.error('❌ Sign-in failed:', err);
        return false;
      }
    },

    // JWT stores tokens between requests
    async jwt({ token, user, account }) {
      // First login
      if (account && user) {
        token.email = user.email;
        token.name = user.name;

        // Preserve admin or student identity
        if (user.adminId) token.adminId = user.adminId;
        if (user.studentId) token.studentId = user.studentId;

        // Store access token ONLY for admin sessions
        if (token.adminId && account.access_token) {
          token.accessToken = account.access_token;
          token.scope = account.scope;
        }
      }

      return token;
    },

    // Expose only correct data to the session
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name;

      if (token.adminId) {
        session.user.adminId = token.adminId;
        session.accessToken = token.accessToken ?? null;
        session.scope = token.scope ?? null;
      } else {
        // Student session → ensure no admin properties leak
        const student = await getStudent(token.email);
        session.user.studentId = student.id;
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
