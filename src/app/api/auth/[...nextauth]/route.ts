import NextAuth, { NextAuthOptions } from "next-auth";
import SpotifyProvider from 'next-auth/providers/spotify';
import { JWT } from "next-auth/jwt";
import axios from "axios";

// Define the structure of the token used in the JWT
interface Token extends JWT {
  accessToken: string;           // Spotify access token
  accessTokenExpires: number;    // Expiration time of the access token
  refreshToken: string;          // Spotify refresh token
  error?: string;                // To track any error during token refresh
  user?: any;                    // Optional user data if you are storing additional user info
}

// Define the NextAuth options
const options: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      authorization: {
        params: {
          scope: 'user-read-email user-read-private streaming user-read-playback-state user-modify-playback-state',
        },
      },
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
        console.log(token, account)
      let jwtToken = token as Token;

      // First time the user signs in
      if (account) {
        return {
          accessToken: account.access_token!,
          accessTokenExpires: Date.now() + ((account as any).expires_in! * 1000),
          refreshToken: account.refresh_token!,
          user: token.user,
        };
      }

      console.log(jwtToken)

      // Return the previous token if the access token has not expired yet
      if (Date.now() < jwtToken.accessTokenExpires) {
        return jwtToken;
      }

      // Access token has expired, refresh it
      return refreshAccessToken(jwtToken);
    },

    async session({ session, token }) {
      const jwtToken = token as Token;
      (session as any).accessToken = jwtToken.accessToken;
      (session as any).error = jwtToken.error;
      return session;
    },
  },
};

// Function to refresh the access token
async function refreshAccessToken(token: Token): Promise<Token> {
  try {
    const url = "https://accounts.spotify.com/api/token";

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await axios.post(url, params, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const refreshedTokens = response.data;

    if (response.status !== 200) {
      throw new Error("Failed to refresh token");
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in * 1000),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // If no new refresh token, reuse the old one
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Export the handler for both GET and POST methods
const handler = NextAuth(options);

export { handler as GET, handler as POST };
