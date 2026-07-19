import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import type { Adapter } from 'next-auth/adapters';
import bcrypt from 'bcryptjs';
import { EMAIL_OTP_MAX_AGE_SECONDS, generateEmailOtp } from '@/lib/email-otp';

export const authConfig: NextAuthConfig = {
  // Required for self-hosted Docker/production. Without this, Auth.js rejects
  // callback requests as UntrustedHost → /auth/error?error=Configuration.
  trustHost: true,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER || '',
      from: process.env.EMAIL_FROM || 'noreply@marotto-solutions.com',
      maxAge: EMAIL_OTP_MAX_AGE_SECONDS,
      generateVerificationToken: async () => generateEmailOtp(),
      sendVerificationRequest: async ({ identifier: email, token, expires }) => {
        const nodemailer = (await import('nodemailer')).default;
        const transport = nodemailer.createTransport(process.env.EMAIL_SERVER || '');
        const minutes = Math.max(1, Math.round((expires.getTime() - Date.now()) / 60_000));

        await transport.sendMail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: `${token} is your Marotto Solutions sign-in code`,
          text: text({ token, email, minutes }),
          html: html({ token, email, minutes }),
        });
      },
    }),
    Credentials({
      name: 'Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Prefer DB role when present; email OTP User may omit custom fields.
        let role = (user as { role?: string }).role;
        if (!role && user.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { role: true },
            });
            role = dbUser?.role || undefined;
          } catch {
            // fall through to default
          }
        }
        (token as { role?: string }).role = role || 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role =
          ((token as { role?: string }).role) || 'admin';
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

function html({ token, email, minutes }: { token: string; email: string; minutes: number }) {
  const escapedEmail = email.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const spaced = token.split('').join(' ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your sign-in code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Marotto Solutions</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Your sign-in code</h2>
        <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${escapedEmail},
        </p>
        <p style="margin: 0 0 24px; color: #666; font-size: 16px; line-height: 1.5;">
          Enter this code in the Marotto admin app to sign in. It expires in ${minutes} minutes.
        </p>
        <p style="margin: 0 0 8px; text-align: center; font-size: 36px; font-weight: 700; letter-spacing: 0.35em; color: #111827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
          ${spaced}
        </p>
        <p style="margin: 24px 0 0; color: #999; font-size: 14px; line-height: 1.5;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; background-color: #f8f9fa; text-align: center; color: #999; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Marotto Solutions. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function text({ token, email, minutes }: { token: string; email: string; minutes: number }) {
  return `Sign in to Marotto Solutions\n\nHello ${email},\n\nYour sign-in code is: ${token}\n\nEnter this code in the admin app. It expires in ${minutes} minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n`;
}
