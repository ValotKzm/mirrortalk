import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/drizzle";
import * as schema from "@/lib/db/schema";
import { nextCookies } from "better-auth/next-js";
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [nextCookies()],
});
