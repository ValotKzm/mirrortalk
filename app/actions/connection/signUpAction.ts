"use server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const signUpAction = async (formData: FormData) => {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    if (
        typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || !password
    ) {
        redirect("/signup?error=true");
    }
    if (password.length < 8) {
        redirect("/signup?error=password-too-short");
    }
    const response = await auth.api.signUpEmail({
        body: {
            name: name.trim(),
            email: email.trim(),
            password,
        },
        asResponse: true,
    });
    if (!response.ok) {
        redirect("/signup?error=true");
    }
    redirect("/");
};
