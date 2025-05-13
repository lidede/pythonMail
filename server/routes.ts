import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SmtpServer } from "./smtp";
import { extractMagicLinks } from "./email-parser";
import { createAccountSchema, insertEmailMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the SMTP server
  const smtpServer = new SmtpServer();
  smtpServer.start();
  
  // Static HTML page for direct viewing (fallback for development)
  app.get("/static-email", (_req: Request, res: Response) => {
    res.sendFile("static-email.html", { root: process.cwd() });
  });

  // Get all email accounts
  app.get("/api/accounts", async (_req: Request, res: Response) => {
    try {
      const accounts = await storage.getEmailAccounts();
      
      // Add unread counts for each account
      const accountsWithUnreadCounts = await Promise.all(
        accounts.map(async (account) => {
          const unreadCount = await storage.getUnreadCount(account.id);
          return {
            ...account,
            unreadCount
          };
        })
      );
      
      res.json(accountsWithUnreadCounts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email accounts" });
    }
  });

  // Get a specific email account
  app.get("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid account ID" });
      }

      const account = await storage.getEmailAccount(id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const unreadCount = await storage.getUnreadCount(account.id);
      
      res.json({ ...account, unreadCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email account" });
    }
  });

  // Create a new email account
  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const data = createAccountSchema.parse(req.body);
      
      // Check if email already exists
      const email = `${data.username}@${data.domain}`;
      const existingAccount = await storage.getEmailAccountByEmail(email);
      
      if (existingAccount) {
        return res.status(409).json({ error: "Email address already exists" });
      }
      
      const account = await storage.createEmailAccount({
        username: data.username,
        domain: data.domain,
        email,
        password: data.password // In a real app, this should be hashed
      });
      
      res.status(201).json({ 
        ...account,
        password: undefined, // Don't return the password
        unreadCount: 0 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: fromZodError(error).message 
        });
      }
      res.status(500).json({ error: "Failed to create email account" });
    }
  });

  // Get all emails for an account
  app.get("/api/accounts/:id/emails", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      if (isNaN(accountId)) {
        return res.status(400).json({ error: "Invalid account ID" });
      }

      const account = await storage.getEmailAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      const emails = await storage.getEmailMessages(accountId);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  // Get a specific email
  app.get("/api/emails/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid email ID" });
      }

      const email = await storage.getEmailMessage(id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      // Mark email as read
      const updatedEmail = await storage.markEmailAsRead(id);
      
      // Extract magic links if any
      const magicLinks = extractMagicLinks(
        updatedEmail.htmlContent || updatedEmail.content
      );
      
      res.json({
        ...updatedEmail,
        magicLinks
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email" });
    }
  });

  // Simulate receiving an email (for testing without actual SMTP)
  app.post("/api/simulate/receive-email", async (req: Request, res: Response) => {
    try {
      const data = insertEmailMessageSchema.parse(req.body);
      
      // Verify the account exists
      const account = await storage.getEmailAccount(data.accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const email = await storage.createEmailMessage(data);
      res.status(201).json(email);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: fromZodError(error).message 
        });
      }
      res.status(500).json({ error: "Failed to simulate email receipt" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
