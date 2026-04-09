"use client";

import { signUpAction } from "@/app/actions/connection/signUpAction";

export const SignUpForm = () => {

    return (
        <form action={signUpAction} className="flex flex-col w-100 gap-1 p-1 m-1 border">
            <label htmlFor="name">Nom d'utilisateur·ice</label>
            <input name="name" type="text" required />
            <label htmlFor="email">E-mail</label>
            <input name="email" type="email" required />
            <label htmlFor="password">Mot de passe</label>
            <input name="password" type="password" required/>
            <button type="submit" className=" bg-green-200">S'incrire</button>
        </form>
    );
};
