import { Suspense } from "react";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-xs text-paper-300 animate-pulse">
          Loading workspace…
        </div>
      }
    >
      <ChatWorkspace initialMode="general" />
    </Suspense>
  );
}

