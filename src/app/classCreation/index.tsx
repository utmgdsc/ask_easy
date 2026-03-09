import header from "../components/header";
import footer from "../components/footer";
import { User } from "@/utils/types";

export default function createClassPage(user: User) {
  if (user.role !== "prof") {
    return (
      <div>
        {header(user)}
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
      {header(user)}
      <div>
        You do not have the Authorization to access the page. Contact support if the error is
        unintended
      </div>
      {footer()}
    </div>
  );
}
