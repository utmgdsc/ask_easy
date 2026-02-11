import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ClassChat from "./classChat";
import SlideViewer from "./slideViewer";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Room() {
  const isMdSize = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isMdSize ? "horizontal" : "vertical"}>
        <ResizablePanel defaultSize={75} minSize={0}>
          <SlideViewer />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={30}>
          <ClassChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
