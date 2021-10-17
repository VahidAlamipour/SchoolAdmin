export interface INotification {
  id?: number;
  message: string;
  type?: 'default' | 'success' | 'error';
  permanent?: boolean;
}
