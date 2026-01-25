"use client";
import ClassChat from "./classChat";
import SlideViewer from "./slideViewer";

export default function Room() {
  return (
    <div className="flex h-screen w-full flex-row bg-background font-sans">
      <SlideViewer />
      <ClassChat />
    </div>
  );
}
