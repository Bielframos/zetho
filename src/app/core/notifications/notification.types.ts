export type NotificationType = 'success' | 'info' | 'error';

export interface Notification {
  id: string;
  message: string;
  type?: NotificationType;
  /** tempo em ms antes de remover automaticamente. 0 = nunca auto-dismiss */
  timeout?: number;
}
