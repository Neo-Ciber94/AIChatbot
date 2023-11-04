import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getConversations } from "@/lib/actions/conversations";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chatbot | Chat",
};

export default async function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conversations = await getConversations();

  return (
    <main className="flex h-screen flex-row overflow-hidden">
      <Sidebar conversations={conversations} />
      <div className="relative flex flex-grow flex-col">
        <Header showSidebarControls />
        {children}
      </div>
    </main>
  );
}
