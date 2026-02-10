import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { createStudent, getStudent } from './data-service';

const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request, user }) {
      return !!auth?.user;
    },
    async signIn({ user, account, profile }) {
      try {
        const existingStudent = await getStudent(user.email);

        if (!existingStudent) {
          const newStudent = await createStudent({
            email: user.email,
            fullName: user.name,
          });
        } else {
        }
        return true;
      } catch (error) {
        console.error('❌ Sign-in failed:', error);
        return false; // Triggers AccessDenied
      }
    },
    async session({session, user}){
      const student = await getStudent(session.user.email)
      session.user.studentId = student.id
      return session
    }
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
