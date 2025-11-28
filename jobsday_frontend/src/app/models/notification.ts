export interface Notification {
  id: number;
  userFrom: number;
  userTo: number;
  type: string;
  title: string;
  message: string;
  url: string;
  isRead: boolean;
  createdAt: string;
}
