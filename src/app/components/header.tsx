import { User, getInitials } from "@/utils/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

function renderAvatar(user: User) {
  return (
    <Avatar className="h-10 w-10">
      <AvatarImage src={user.pfp} alt={user.username} />
      <AvatarFallback className="bg-stone-50 font-medium text-lg text-stone-900 tracking-tighter">
        {getInitials(user.username)}
      </AvatarFallback>
    </Avatar>
  );
}

export default function header(user: User) {
  return (
    <div
      className="absolute items-center justify-between shadow-md top-6
     left-7 right-7 z-[5] bg-white rounded-lg 
     text-2xl font-bold text-left py-2 px-3 flex 
     border-3 border-blue-50"
    >
      <Link href="/" className="text-lg font-bold px-2 hover:opacity-80 transition-opacity">
        AskEasy
      </Link>

      <div className=" flex flex-end gap-2 items-center">{renderAvatar(user)}</div>
    </div>
  );
}
