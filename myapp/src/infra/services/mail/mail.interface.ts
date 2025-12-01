export interface EmailProvider {
  send(payload: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ id?: string; error?: any }>;
}
