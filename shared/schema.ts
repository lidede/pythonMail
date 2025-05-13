import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Email accounts table
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  domain: text("domain").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).pick({
  username: true,
  domain: true,
  email: true,
  password: true,
});

// Email messages table
export const emailMessages = pgTable("email_messages", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  sender: text("sender").notNull(),
  senderEmail: text("sender_email").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  htmlContent: text("html_content"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  read: boolean("read").default(false).notNull(),
  headers: jsonb("headers"),
});

export const insertEmailMessageSchema = createInsertSchema(emailMessages).pick({
  accountId: true,
  sender: true,
  senderEmail: true,
  recipient: true,
  subject: true,
  content: true,
  htmlContent: true,
  headers: true,
});

// Types
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;

// Custom schemas for validation
export const createAccountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  domain: z.string().min(3, "Domain must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type CreateAccountData = z.infer<typeof createAccountSchema>;
