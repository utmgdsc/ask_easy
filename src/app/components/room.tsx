import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ClassChat from "./classChat";
import SlideViewer from "./slideViewer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createContext, useState } from "react";

export const SlideUpdateContext = createContext({ isHidden: false, rerender: () => {} });

function chatPanel(isMdSize: boolean) {
  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isMdSize ? "horizontal" : "vertical"}>
        <ResizablePanel minSize={30}>
          <ClassChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function chatAndSlidePanel(
  isMdSize: boolean,
  resizableWidth: number,
  setResizableWidth: (width: number) => void
) {
  return (
    <div className="h-screen w-full bg-background font-sans">
      <ResizablePanelGroup direction={isMdSize ? "horizontal" : "vertical"}>
        <ResizablePanel
          defaultSize={100 - resizableWidth}
          minSize={0}
          onResize={(panelWidth) => {
            setResizableWidth(panelWidth);
          }}
        >
          <SlideViewer />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={resizableWidth} minSize={30}>
          <ClassChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default function Room() {
  const isMdSize = useMediaQuery("(min-width: 1024px)");
  const [isHidden, setIsHidden] = useState(false);
  const [resizableWidth, setResizableWidth] = useState(30);

  function rerender() {
    setIsHidden((prev) => !prev);
  }
  return (
    <div className="h-screen w-full bg-background font-sans">
      <SlideUpdateContext.Provider value={{ isHidden, rerender }}>
        {isHidden
          ? chatAndSlidePanel(isMdSize, resizableWidth, setResizableWidth)
          : chatPanel(isMdSize)}
      </SlideUpdateContext.Provider>
    </div>
  );
}
