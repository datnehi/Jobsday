export interface PresenceDto {
  userId: number;
  status: 'ONLINE' | 'OFFLINE';
  lastOnlineAt?: string;
}
