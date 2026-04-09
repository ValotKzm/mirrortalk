"use client";

import { logOutAction } from "@/app/actions/connection/logOutAction";

export const LogOutButton = () => {

    return (
        <form action={logOutAction} className="relative pt-1 pl-1 bg-blue-50">
            <button className="bg-red-200">Se déconnecter</button>
        </form>
    );
};
