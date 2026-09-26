"use client";

import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { signUpAction } from "@/app/actions/connection/signUpAction";

export const SignUpForm = () => {
    return (
        <form action={signUpAction} className="signup-form">
            <div className="signup-field">
                <label htmlFor="signup-name">Votre nom</label>
                <div className="signup-input-wrap">
                    <UserRound size={18} aria-hidden="true" />
                    <input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Ex. Camille Martin"
                        autoComplete="name"
                        required
                    />
                </div>
                <span className="signup-field-hint">Ce nom sera visible pendant vos sessions.</span>
            </div>

            <div className="signup-field">
                <label htmlFor="signup-email">Adresse e-mail</label>
                <div className="signup-input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="vous@exemple.fr"
                        autoComplete="email"
                        required
                    />
                </div>
            </div>

            <div className="signup-field">
                <label htmlFor="signup-password">Mot de passe</label>
                <div className="signup-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Choisissez un mot de passe"
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </div>
                <span className="signup-field-hint">8 caractères minimum.</span>
            </div>

            <button type="submit" className="signup-submit">
                <span>Créer mon compte</span>
                <ArrowRight size={18} />
            </button>
        </form>
    );
};
