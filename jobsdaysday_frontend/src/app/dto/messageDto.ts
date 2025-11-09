export interface MessageDto {
  id?: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType?: string;
  createdAt: string;
  isRead?: string;
}
