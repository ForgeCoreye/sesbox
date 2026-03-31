// Auth options stub — configure next-auth provider when ready.
// See: https://next-auth.js.org/configuration/options

export const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me',
};
