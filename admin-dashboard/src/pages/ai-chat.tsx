import React, { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, Copy, Check, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

// AI Elements
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageToolbar,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from "@/components/ai-elements/attachments";
import { ChatStatus, UIMessage, FileUIPart } from "@/types/ai-v2";

interface ExtendedUIMessage extends UIMessage {
  timestamp: Date;
  files?: FileUIPart[];
}

const PromptAttachments = () => {
  const { files, remove } = usePromptInputAttachments();
  if (files.length === 0) return null;
  return (
    <div className="px-4 pb-2 border-b bg-muted/5">
      <Attachments
        variant="inline"
        className="flex-nowrap overflow-x-auto py-2"
      >
        {files.map((file) => (
          <Attachment
            key={file.id}
            data={file}
            onRemove={() => remove(file.id)}
          >
            <AttachmentPreview />
            <div className="text-[10px] max-w-25 truncate px-1">
              {file.filename}
            </div>
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </div>
  );
};

const AIChatPageContent: React.FC = () => {
  const [messages, setMessages] = useState<ExtendedUIMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ai_chat_history_v5");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        );
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ai_chat_history_v5", JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text || status !== "idle") return;

      const userMsg: ExtendedUIMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
        files: message.files,
      };

      setMessages((prev) => [...prev, userMsg]);
      setStatus("submitted");

      try {
        const response = await api.post("/ai/chat", {
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        if (response.data && response.data.content) {
          const assistantMsg: ExtendedUIMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.data.content,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStatus("idle");
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        toast.error("فشل في الاتصال بالمساعد");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    },
    [messages, status],
  );

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("تم النسخ");
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("ai_chat_history_v5");
    toast.success("تم مسح المحادثة");
  };

  return (
    <div
      className="relative flex flex-col h-[calc(100vh-64px)] w-full bg-background overflow-hidden"
      dir="rtl"
    >
      {/* Floating Clear Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="secondary"
          size="icon"
          onClick={clearChat}
          className="size-8 rounded-full shadow-md hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-90"
          title="مسح المحادثة"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Conversation Area */}
      <Conversation className="flex-1 bg-transparent">
        <ConversationContent className="max-w-4xl mx-auto py-12 px-6 pb-40 space-y-8">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="مرحباً بك"
              description="كيف يمكنني مساعدتك اليوم؟"
              className="pt-24 opacity-50"
            />
          ) : (
            messages.map((msg) => (
              <Message
                key={msg.id}
                from={msg.role}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <MessageContent
                  className={cn(
                    "p-0", // Remove default padding for assistant to look "direct on screen"
                    msg.role === "assistant"
                      ? "bg-transparent shadow-none border-none"
                      : "",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                      {msg.content}
                    </MessageResponse>
                  ) : (
                    // User Message - Only the default "gray" box from MessageContent (secondary)
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </MessageContent>

                <MessageToolbar
                  className={cn(
                    "mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div className="text-[10px] font-medium text-muted-foreground/50">
                    {msg.timestamp.toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {msg.role === "assistant" && (
                    <MessageActions>
                      <MessageAction onClick={() => copy(msg.content, msg.id)}>
                        {copiedId === msg.id ? (
                          <Check className="size-3.5 text-green-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </MessageAction>
                    </MessageActions>
                  )}
                </MessageToolbar>
              </Message>
            ))
          )}
          <div ref={messagesEndRef} />
        </ConversationContent>
        <ConversationScrollButton className="bottom-24" />
      </Conversation>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 z-40 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <PromptInput onSubmit={handleSubmit} className="bg-card">
            <PromptAttachments />
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="اسألني عن أي شيء..."
                disabled={status !== "idle"}
                className="min-h-15 py-5 px-8 text-sm resize-none border-none focus-visible:ring-0 bg-transparent"
              />
            </PromptInputBody>
            <PromptInputFooter className="px-6 pb-4 flex justify-between items-center">
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger
                    variant="ghost"
                    className="rounded-full size-10 hover:bg-muted"
                  >
                    <PlusIcon className="size-5" />
                  </PromptInputActionMenuTrigger>
                  <PromptInputActionMenuContent
                    align="start"
                    className="rounded-2xl"
                  >
                    <PromptInputActionAddAttachments label="إضافة ملفات" />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>

              <PromptInputSubmit
                status={status}
                disabled={status !== "idle"}
                className="rounded-full size-10 shrink-0 shadow-sm"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

const AIChatPage: React.FC = () => {
  return (
    <PromptInputProvider>
      <AIChatPageContent />
    </PromptInputProvider>
  );
};

export default AIChatPage;
