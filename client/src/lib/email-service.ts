import { apiRequest } from "./queryClient";
import { EmailAccount, EmailMessage, CreateAccountData } from "@shared/schema";

interface EmailAccountWithUnread extends EmailAccount {
  unreadCount: number;
}

interface EmailMessageWithMagicLinks extends EmailMessage {
  magicLinks: string[];
}

export const emailService = {
  // Email accounts
  getAccounts: async (): Promise<EmailAccountWithUnread[]> => {
    const response = await apiRequest("GET", "/api/accounts");
    return await response.json();
  },
  
  getAccount: async (id: number): Promise<EmailAccountWithUnread> => {
    const response = await apiRequest("GET", `/api/accounts/${id}`);
    return await response.json();
  },
  
  createAccount: async (data: CreateAccountData): Promise<EmailAccountWithUnread> => {
    const response = await apiRequest("POST", "/api/accounts", data);
    return await response.json();
  },
  
  // Email messages
  getEmails: async (accountId: number): Promise<EmailMessage[]> => {
    const response = await apiRequest("GET", `/api/accounts/${accountId}/emails`);
    return await response.json();
  },
  
  getEmail: async (id: number): Promise<EmailMessageWithMagicLinks> => {
    const response = await apiRequest("GET", `/api/emails/${id}`);
    return await response.json();
  },
  
  // For testing purposes
  simulateReceiveEmail: async (data: Partial<EmailMessage>): Promise<EmailMessage> => {
    const response = await apiRequest("POST", "/api/simulate/receive-email", data);
    return await response.json();
  }
};
