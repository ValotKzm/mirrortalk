"use server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const logInAction = async (formData: FormData) => {
    const email = formData.get("email");
    const password = formData.get("password");
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        redirect("/login?error=true");
    }
    const response = await auth.api.signInEmail({
        body: {
            email: email.trim(),
            password,
        },
        asResponse: true,
    });
    if (!response.ok) {
        redirect("/login?error=true");
    }
    redirect("/");
};
