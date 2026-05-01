import type { NextAuthOptions, Profile } from "next-auth";
import { getServerSession } from "next-auth";
import YandexProvider from "next-auth/providers/yandex";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type YandexProfile = Profile & {
  id?: string;
  default_email?: string;
  email?: string;
  display_name?: string;
  real_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_id?: string;
  default_avatar_id?: string;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID ?? "",
      clientSecret: process.env.YANDEX_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "yandex" || !profile) return false;

      const yandexProfile = profile as YandexProfile;
      const yandexId = account.providerAccountId ?? yandexProfile.id;
      const email = yandexProfile.default_email ?? yandexProfile.email;
      if (!yandexId || !email) return false;

      const displayName =
        yandexProfile.display_name ??
        yandexProfile.real_name ??
        [yandexProfile.first_name, yandexProfile.last_name].filter(Boolean).join(" ") ??
        email;
      const avatarId = yandexProfile.default_avatar_id ?? yandexProfile.avatar_id;
      const avatarUrl = avatarId ? `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200` : null;

      const user = await prisma.user.upsert({
        where: { yandexId },
        update: { email, displayName, avatarUrl },
        create: { yandexId, email, displayName, avatarUrl }
      });

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "yandex") {
        const yandexProfile = profile as YandexProfile | undefined;
        const yandexId = account.providerAccountId ?? yandexProfile?.id;
        if (yandexId) {
          const user = await prisma.user.findUnique({ where: { yandexId } });
          token.userId = user?.id;
          token.yandexId = yandexId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.yandexId) {
        session.user.id = token.userId;
        session.user.yandexId = token.yandexId;
      }
      return session;
    }
  }
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
