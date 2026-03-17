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
      const emailVerified =
        profile && "email_verified" in profile
          ? Boolean((profile as { email_verified?: boolean }).email_verified)
          : false;

      if (!email || !emailVerified) {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});