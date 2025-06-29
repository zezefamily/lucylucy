export interface ConversationStarter {
  starters: string[];
  topic: string;
  analysis?: string;
}

export interface ConversationStarterRequest {
  topic: string;
  locale?: string;
}

export interface ConversationStarterResponse {
  success: boolean;
  starters: string[];
  topic: string;
  analysis?: string;
  error?: string;
} 