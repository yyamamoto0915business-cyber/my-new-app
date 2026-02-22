import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { getUserRole, setUserRole, getOrCreateUser } from "@/lib/auth-users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_RESEND_KEY
      ? [
          Resend({
            apiKey: process.env.AUTH_RESEND_KEY,
            from: process.env.AUTH_RESEND_FROM ?? "noreply@example.com",
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = String(credentials.email).toLowerCase();
        const name = (credentials.name as string) || email.split("@")[0] || "User";
        if (email === "organizer@demo") {
          const u = getOrCreateUser(email, "主催者デモ", "o1");
          return { id: u.id, email: u.email, name: u.name };
        }
        const user = getOrCreateUser(email, name);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        getOrCreateUser(
          user.email,
          user.name ?? user.email.split("@")[0] ?? "User",
          user.id ?? undefined
        );
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const uid = user.id ?? user.email ?? "";
        token.id = uid;
        token.role = getUserRole(uid);
      }
      if (trigger === "update" && session?.role) {
        if (token.id) setUserRole(token.id, session.role);
        token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? null;
      }
      return session;
    },
    authorized({ auth: a, request }) {
      // 開発中: AUTH_DISABLED のときは全ルート許可
      if (
        process.env.AUTH_DISABLED === "true" ||
        (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
      ) {
        return true;
      }
      const path = request.nextUrl.pathname;
      // 主催者・DM はログイン不要
      if (path.startsWith("/volunteer/inbox")) {
        return !!a?.user;
      }
      return true;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "dev-secret-change-in-production",
});
