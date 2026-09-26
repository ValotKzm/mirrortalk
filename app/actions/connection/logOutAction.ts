"use server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const logOutAction = async () => {
    await auth.api.signOut({ headers: await headers() });
    redirect("/");
};
