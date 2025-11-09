export interface Conversation {
  id: number;
  companyId: number;
  candidateId: number;
  companyName?: string;
  companyLogoUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

