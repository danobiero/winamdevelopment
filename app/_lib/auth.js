import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { createStudent, getAdmin, getStudent } from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // No extra authorization params needed for default email/profile
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      try {
        // 1. Check Admin
        const admin = await getAdmin(user.email);
        if (admin) {
          user.adminId = admin.id;
          return true;
        }

        // 2. Check/Create Student
        const student = await getStudent(user.email);
        if (!student) {
          const newStudent = await createStudent({
            email: user.email,
            fullName: user.name,
          });
          user.studentId = newStudent.id;
        } else {
          user.studentId = student.id;
        }

        return true;
      } catch (err) {
        console.error('❌ Sign-in database error:', err);
        return false;
      }
    },

    async jwt({ token, user }) {
      // 'user' is only passed on the first call (sign in)
      if (user) {
        token.adminId = user.adminId || null;
        token.studentId = user.studentId || null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.adminId = token.adminId;
        session.user.studentId = token.studentId;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
  // Essential for Vercel deployment
  trustHost: true,
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authConfig);
