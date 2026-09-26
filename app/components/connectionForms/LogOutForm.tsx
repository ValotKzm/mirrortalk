"use client";

import { logOutAction } from "@/app/actions/connection/logOutAction";

export const LogOutButton = () => {

    return (
        <form action={logOutAction} className="auth-control">
            <button className="logout-button">Se déconnecter</button>
        </form>
    );
};
