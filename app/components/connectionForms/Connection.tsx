"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { LogInForm } from "./LogInForm";
import { LogOutButton } from "./LogOutForm";

export const Connection = async () => {

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <>
      {session ?
        <LogOutButton /> : (
            <LogInForm />
        )}
    </>
  );
};
