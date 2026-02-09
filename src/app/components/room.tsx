import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ClassChat from "./classChat";
import SlideViewer from "./slideViewer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createContext, useContext, useState } from "react";

const ShowSlideContext = createContext(true);

export function useShowSlide(): boolean {
  return useContext(ShowSlideContext);
}

export default function Room() {
  const [showSlide, setShowSlide] = useState(true);
  const isMdSize = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isMdSize ? "horizontal" : "vertical"}>
        <ShowSlideContext.Provider value={showSlide}>
          <ResizablePanel defaultSize={75} minSize={0}>
            <SlideViewer />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={0}>
            <ClassChat setShow={setShowSlide} />
          </ResizablePanel>
        </ShowSlideContext.Provider>
      </ResizablePanelGroup>
    </div>
  );
}
