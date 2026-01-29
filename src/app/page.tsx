import ClassChat from "./components/classChat";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col bg-background font-sans">
      <main className="flex-1 overflow-hidden">
        <ClassChat />
      </main>
    </div>
  );
}
