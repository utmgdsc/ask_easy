import header from "../../components/header";
import footer from "../../components/footer";
import { User } from "@/utils/types";

export default function NoPermissions({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-stone-800">
      {header(user)}
      <div className="flex-grow flex items-center justify-center pt-32 pb-12 px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-stone-900 tracking-wide uppercase">
            Access Denied
          </h1>
          <p className="text-stone-600">
            You do not have the Authorization to access the page. Contact support if the error is
            unintended.
          </p>
        </div>
      </div>
      {footer()}
    </div>
  );
}
