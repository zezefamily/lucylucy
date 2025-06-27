export interface ConversationStarter {
  starters: string[];
  topic: string;
}

export interface ConversationStarterRequest {
  topic: string;
  locale?: string;
}

export interface ConversationStarterResponse {
  success: boolean;
  starters: string[];
  topic: string;
  error?: string;
} 