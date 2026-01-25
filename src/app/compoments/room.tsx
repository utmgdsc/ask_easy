import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ClassChat from "./classChat";
import SlideViewer from "./slideViewer";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Room() {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isDesktop ? "horizontal" : "vertical"}>
        <ResizablePanel defaultSize={75} minSize={30}>
          <SlideViewer />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={20}>
          <ClassChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
