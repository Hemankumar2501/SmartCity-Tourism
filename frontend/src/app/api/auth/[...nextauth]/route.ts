import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Accept any mock login where password is at least 6 characters long
        if (credentials?.email && credentials?.password && credentials.password.length >= 6) {
          const email = credentials.email;
          return {
            id: `usr_${Math.random().toString(36).substring(2, 9)}`,
            name: email.split("@")[0] || "Traveler",
            email: email,
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          };
        }
        return null;
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || "smart-city-tourism-secret-key-12345",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
