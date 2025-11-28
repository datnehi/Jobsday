export interface MessageDto {
  id?: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  seenAt?: string;
}
