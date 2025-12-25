import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { authenticator } from 'otplib';
import { getDatabase } from '../db';
import { getUser } from '../db/queries';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        totp: { label: '2FA Code', type: 'text' },
      },
      authorize: async (credentials) => {
        try {
          // Validate all credentials are provided
          if (!credentials?.username || !credentials?.password || !credentials?.totp) {
            console.warn('⚠️ Missing credentials in login attempt');
            return null;
          }

          // Validate credential types
          if (
            typeof credentials.username !== 'string' ||
            typeof credentials.password !== 'string' ||
            typeof credentials.totp !== 'string'
          ) {
            console.warn('⚠️ Invalid credential types');
            return null;
          }

          // Validate TOTP format (6 digits)
          if (!/^\d{6}$/.test(credentials.totp)) {
            console.warn('⚠️ Invalid TOTP format');
            return null;
          }

          const db = getDatabase();
          const user: any = getUser(db);

          // Check if user exists
          if (!user) {
            console.warn('⚠️ No user configured in database');
            // Use constant-time comparison to prevent timing attacks
            await compare(credentials.password, '$2a$10$abcdefghijklmnopqrstuv'); // Dummy comparison
            return null;
          }

          // Check username (case-sensitive)
          if (user.username !== credentials.username) {
            console.warn('⚠️ Invalid username');
            // Still do password comparison to prevent timing attacks
            await compare(credentials.password, user.password_hash);
            return null;
          }

          // Verify password
          const passwordValid = await compare(credentials.password, user.password_hash);
          if (!passwordValid) {
            console.warn('⚠️ Invalid password');
            return null;
          }

          // Verify TOTP with window tolerance
          let totpValid = false;
          try {
            totpValid = authenticator.verify({
              token: credentials.totp,
              secret: user.totp_secret,
            });

            // Also try with backup codes if TOTP fails
            if (!totpValid && user.backup_codes) {
              const backupCodes: string[] = JSON.parse(user.backup_codes);
              if (backupCodes.includes(credentials.totp)) {
                console.log('✅ Login with backup code');
                // TODO: Remove used backup code from database
                totpValid = true;
              }
            }
          } catch (error) {
            console.error('❌ TOTP verification error:', error);
            return null;
          }

          if (!totpValid) {
            console.warn('⚠️ Invalid TOTP code');
            return null;
          }

          console.log('✅ Successful authentication');

          return {
            id: '1',
            name: user.username,
          };
        } catch (error) {
          console.error('❌ Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
