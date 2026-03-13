import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      const emailVerified = "email_verified" in (profile ?? {}) ? Boolean((profile as { email_verified?: boolean }).email_verified) : false;

      if (!email || !emailVerified) {
        return false;
      }

      // Restrict to your firm domain.
      return email.toLowerCase().endsWith("@fernandojlopez.com");
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});