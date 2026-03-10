import { User } from "@/utils/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function renderAvatar(user: User) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.pfp} alt={user.username} />
      <AvatarFallback className="bg-stone-50 font-medium text-xl">
        {user.username[0]}
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

      <div className=" flex flex-end gap-2 ">
        {user.role === "PROFESSOR" && (
          <button className="rounded-lg bg-stone-100 hover:bg-stone-300 px-4 py-2 text-sm font-medium text-stone-900 transition-colors">
            Create a Class
          </button>
        )}
        {renderAvatar(user)}
      </div>
    </div>
  );
}
