import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import type { Adapter } from 'next-auth/adapters';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER || '',
      from: process.env.EMAIL_FROM || 'noreply@marotto-solutions.com',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const { host } = new URL(url);
        const nodemailer = (await import('nodemailer')).default;
        const transport = nodemailer.createTransport(process.env.EMAIL_SERVER || '');

        await transport.sendMail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: `Sign in to ${host}`,
          text: text({ url, host }),
          html: html({ url, host, email }),
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
        // @ts-ignore
        token.role = user.role || 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role || 'admin';
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Email HTML template
function html({ url, host, email }: { url: string; host: string; email: string }) {
  const escapedEmail = email.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedHost = host.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${escapedHost}</title>
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
        <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Sign in to your account</h2>
        <p style="margin: 0 0 20px; color: #666; font-size: 16px; line-height: 1.5;">
          Hello ${escapedEmail},
        </p>
        <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.5;">
          Click the button below to sign in to your Marotto Solutions admin dashboard.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="${url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Sign In</a>
            </td>
          </tr>
        </table>
        <p style="margin: 30px 0 0; color: #999; font-size: 14px; line-height: 1.5;">
          If you didn't request this email, you can safely ignore it. This link will expire in 24 hours.
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

// Email text fallback
function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n\n${url}\n\nIf you didn't request this email, you can safely ignore it.\n`;
}
