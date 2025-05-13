import { 
  EmailAccount, 
  InsertEmailAccount, 
  EmailMessage, 
  InsertEmailMessage 
} from "@shared/schema";

export interface IStorage {
  // Email account operations
  getEmailAccounts(): Promise<EmailAccount[]>;
  getEmailAccount(id: number): Promise<EmailAccount | undefined>;
  getEmailAccountByEmail(email: string): Promise<EmailAccount | undefined>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  
  // Email message operations
  getEmailMessages(accountId: number): Promise<EmailMessage[]>;
  getEmailMessage(id: number): Promise<EmailMessage | undefined>;
  createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage>;
  markEmailAsRead(id: number): Promise<EmailMessage>;
  getUnreadCount(accountId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private emailAccounts: Map<number, EmailAccount>;
  private emailMessages: Map<number, EmailMessage>;
  private accountCurrentId: number;
  private messageCurrentId: number;

  constructor() {
    this.emailAccounts = new Map();
    this.emailMessages = new Map();
    this.accountCurrentId = 1;
    this.messageCurrentId = 1;
    
    // Create some initial accounts for demo purposes
    this.seedData();
  }

  private seedData() {
    // Add some example email accounts
    const accounts = [
      {
        username: "john.doe",
        domain: "openmail.org",
        email: "john.doe@openmail.org",
        password: "password123"
      },
      {
        username: "dev",
        domain: "openmail.org",
        email: "dev@openmail.org",
        password: "password123"
      },
      {
        username: "support",
        domain: "openmail.org",
        email: "support@openmail.org",
        password: "password123"
      }
    ];
    
    accounts.forEach(account => this.createEmailAccount(account));
  }

  // Email Account Methods
  async getEmailAccounts(): Promise<EmailAccount[]> {
    return Array.from(this.emailAccounts.values());
  }

  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    return this.emailAccounts.get(id);
  }

  async getEmailAccountByEmail(email: string): Promise<EmailAccount | undefined> {
    return Array.from(this.emailAccounts.values()).find(
      account => account.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createEmailAccount(insertAccount: InsertEmailAccount): Promise<EmailAccount> {
    const id = this.accountCurrentId++;
    const createdAt = new Date();
    const account: EmailAccount = { ...insertAccount, id, createdAt };
    this.emailAccounts.set(id, account);
    return account;
  }

  // Email Message Methods
  async getEmailMessages(accountId: number): Promise<EmailMessage[]> {
    return Array.from(this.emailMessages.values())
      .filter(message => message.accountId === accountId)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()); // Newest first
  }

  async getEmailMessage(id: number): Promise<EmailMessage | undefined> {
    return this.emailMessages.get(id);
  }

  async createEmailMessage(insertMessage: InsertEmailMessage): Promise<EmailMessage> {
    const id = this.messageCurrentId++;
    const receivedAt = new Date();
    const read = false;
    // Ensure htmlContent is always string | null
    const htmlContent = insertMessage.htmlContent === undefined ? null : insertMessage.htmlContent;
    // Ensure headers is not undefined
    const headers = insertMessage.headers || {};
    
    const message: EmailMessage = { 
      ...insertMessage, 
      id, 
      receivedAt, 
      read,
      htmlContent,
      headers
    };
    
    this.emailMessages.set(id, message);
    return message;
  }

  async markEmailAsRead(id: number): Promise<EmailMessage> {
    const message = this.emailMessages.get(id);
    if (!message) {
      throw new Error(`Email message with id ${id} not found`);
    }
    
    const updatedMessage = { ...message, read: true };
    this.emailMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getUnreadCount(accountId: number): Promise<number> {
    return Array.from(this.emailMessages.values())
      .filter(message => message.accountId === accountId && !message.read)
      .length;
  }
}

export const storage = new MemStorage();
