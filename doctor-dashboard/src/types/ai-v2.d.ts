/**
 * Mock types to replace Vercel AI SDK dependencies
 */

export type ChatStatus = "idle" | "loading" | "error" | "submitted" | "streaming" | "ready";

export interface FileUIPart {
  type: "file";
  url: string;
  mediaType: string;
  filename?: string;
}

export interface SourceDocumentUIPart {
  type: "source-document";
  sourceId: string;
  mediaType: string;
  title: string;
}

export interface UIMessage {
  id: string;
  role: "system" | "user" | "assistant" | "data";
  content: string;
  parts?: any[];
  toolInvocations?: any[];
}

export type ToolUIPart = any;
export type DynamicToolUIPart = any;
export type LanguageModelUsage = any;
export type Tool = any;
export type Experimental_GeneratedImage = any;
export type Experimental_TranscriptionResult = any;
export type Experimental_SpeechResult = any;
