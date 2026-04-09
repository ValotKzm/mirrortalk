"use server";
import { auth } from "@/auth";
import { headers } from "next/headers";

export const logOutAction = async () => {
    await auth.api.signOut({ headers: await headers() });
};
