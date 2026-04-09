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
        <div ref={containerRef} className="relative pt-1 pl-1 bg-blue-50">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="bg-blue-200"
            >
                Se connecter
            </button>
            <form 
                action={logInAction} 
                className={`absolute top-0.5 left-0.5 flex gap-2 p-0 bg-white transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <label htmlFor="email" className="sr-only">E-mail</label>
                <input name="email" type="email" placeholder="E-mail" required />
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <input name="password" type="password" placeholder="Mot de passe" required />
                <button type="submit" className="bg-blue-200">Connexion</button>
                <Link href="/signup"><button onClick={() => setIsOpen(!isOpen)} className="bg-green-200">Inscription</button></Link>
            </form>
        </div>
    );
};
