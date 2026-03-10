import header from "../components/header";
import footer from "../components/footer";
import { User } from "@/utils/types";

export default function createClassPage() {
  //sample user
  const placeholder_user: User = {
    username: "Hi",
    pfp: "H",
    role: "STUDENT",
  }; // For testing

  if (placeholder_user.role !== "PROFESSOR") {
    return (
      <div>
        {header(placeholder_user)}
        <div>
          You do not have the Authorization to access the page. Contact support if the error is
          unintended
        </div>
        {footer()}
      </div>
    );
  }
  return (
    <div>
      {header(placeholder_user)}
      <div>
        You do not have the Authorization to access the page. Contact support if the error is
        unintended
      </div>
      {footer()}
    </div>
  );
}
