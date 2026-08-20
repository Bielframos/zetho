export type NotificationType = 'success' | 'info' | 'error';

export interface Notification {
  id: string;
  message: string;
  type?: NotificationType;
  iconUrl?: string;
  closing?: boolean;
  /** tempo em ms antes de remover automaticamente. 0 = nunca auto-dismiss */
  timeout?: number;
}
