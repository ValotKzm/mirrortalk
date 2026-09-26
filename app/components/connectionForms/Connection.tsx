import { LogInForm } from "./LogInForm";
import { LogOutButton } from "./LogOutForm";

export const Connection = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <>
      {isAuthenticated ? <LogOutButton /> : <LogInForm />}
    </>
  );
};
