"use client";

import { useState, useEffect, useRef } from "react";
import { logInAction } from "@/app/actions/connection/logInAction";
import Link from "next/link";

export const LogInForm = () => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!isOpen) return;
            const target = e.target as Node;
            if (containerRef.current && !containerRef.current.contains(target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="auth-control">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="auth-trigger"
                type="button"
                aria-expanded={isOpen}
                aria-controls="login-panel"
            >
                Se connecter
            </button>
            <form 
                id="login-panel"
                action={logInAction} 
                className="auth-panel"
                hidden={!isOpen}
            >
                <label htmlFor="login-email">E-mail</label>
                <input id="login-email" name="email" type="email" autoComplete="email" required />
                <label htmlFor="login-password">Mot de passe</label>
                <input id="login-password" name="password" type="password" autoComplete="current-password" required />
                <button type="submit" className="auth-submit">Connexion</button>
                <Link href="/signup" onClick={() => setIsOpen(false)} className="auth-link">Créer un compte</Link>
            </form>
        </div>
    );
};
