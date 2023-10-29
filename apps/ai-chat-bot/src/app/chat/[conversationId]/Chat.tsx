"use client";

import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/client/hooks/use-chat";
import { type ConversationMessage } from "@/lib/actions/conversationMessages";
import { useToast } from "@/client/hooks/use-toast";
import {
  type Conversation,
  generateConversationTitle,
} from "@/lib/actions/conversations";
import { eventEmitter } from "@/lib/events";
import { DEFAULT_CONVERSATION_TITLE } from "@/lib/common/constants";

type ChatProps = {
  conversation: Conversation;
  messages: ConversationMessage[];
};

export default function Chat(props: ChatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();
  const [conversation, setConversation] = useState(props.conversation);
  const { conversationId } = useParams<{ conversationId: string }>();
  const { chat, isLoading, messages } = useChat({
    conversationId,
    messages: props.messages,
    model: "gpt-3.5-turbo",
    onError(err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      console.error(err);
      toast.error(message);
    },
  });

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    setLoaded(true);
  }, [messages]);

  const handleChat = async (message: string) => {
    await chat(message);

    const assistantMessages = messages.filter((x) => x.role === "assistant");

    // Only after the first message we generate a title
    if (
      assistantMessages.length >= 1 &&
      assistantMessages.length <= 3 &&
      conversation.title === DEFAULT_CONVERSATION_TITLE
    ) {
      const result = await generateConversationTitle({
        conversationId,
      });

      if (result.type === "error") {
        toast.error(result.error);
      } else {
        const newTitle = result.value.conversationTitle;
        eventEmitter.conversationTitleChanged({
          conversationId,
          newTitle,
        });

        setConversation((prev) => ({ ...prev, title: newTitle }));
      }
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative h-full w-full ${
          loaded ? "visible overflow-y-auto" : "invisible overflow-y-scroll"
        }`}
      >
        {messages.length === 0 ? (
          <div
            className="flex h-full flex-grow flex-row items-center justify-center font-mono text-5xl 
          font-bold text-gray-400 dark:text-gray-300/50"
          >
            AIChatbot
          </div>
        ) : (
          <ChatMessages messages={messages} />
        )}
      </div>

      <div className={`absolute bottom-4 left-1/2 w-[90%] -translate-x-1/2`}>
        <ChatInput onSend={handleChat} disabled={isLoading} />
      </div>
    </>
  );
}
