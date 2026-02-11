import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FilterTabs({
  commentView,
  setCommentView,
}: {
  commentView: "all" | "unresolved" | "resolved";
  setCommentView: (view: "all" | "unresolved" | "resolved") => void;
}) {
  return (
    <Tabs
      value={commentView}
      onValueChange={(v) => setCommentView(v as "all" | "unresolved" | "resolved")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
        <TabsTrigger value="resolved">Resolved</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
