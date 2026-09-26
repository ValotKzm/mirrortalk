"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const LogInForm = () => {
    const pathname = usePathname();
    if (pathname === "/login") return null;

    return (
        <div className="auth-control">
            <Link href="/login" className="auth-trigger">
                Se connecter
            </Link>
        </div>
    );
};
