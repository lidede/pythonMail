import { createServer, Socket } from "net";
import { storage } from "./storage";
import { parseEmail } from "./email-parser";
import { InsertEmailMessage } from "@shared/schema";
import { log } from "./vite";

/**
 * Simple SMTP server implementation that can receive emails
 * from external senders and store them in our system.
 */
export class SmtpServer {
  private server;
  private port = 25;
  private host = "0.0.0.0";

  constructor() {
    this.server = createServer((socket) => this.handleConnection(socket));
  }

  private handleConnection(socket: Socket) {
    let buffer = "";
    let mailFrom = "";
    let rcptTo = "";
    let dataMode = false;
    let emailData = "";

    // Send greeting
    socket.write("220 openmail.org SMTP Service ready\r\n");

    socket.on("data", async (data) => {
      const input = data.toString();
      buffer += input;

      if (dataMode) {
        emailData += input;
        // Check if the email data is complete
        if (emailData.endsWith("\r\n.\r\n")) {
          dataMode = false;
          emailData = emailData.slice(0, -5); // Remove the trailing "\r\n.\r\n"

          try {
            // Process and store the email
            const recipient = rcptTo.trim();
            const account = await storage.getEmailAccountByEmail(recipient);

            if (account) {
              const parsedEmail = await parseEmail(emailData);
              
              const emailMessage: InsertEmailMessage = {
                accountId: account.id,
                sender: parsedEmail.from.name || parsedEmail.from.address,
                senderEmail: parsedEmail.from.address,
                recipient: recipient,
                subject: parsedEmail.subject || "(No Subject)",
                content: parsedEmail.text || "",
                htmlContent: parsedEmail.html || null,
                headers: parsedEmail.headers
              };

              await storage.createEmailMessage(emailMessage);
              log(`Email received for ${recipient} from ${parsedEmail.from.address}`);
            } else {
              log(`Recipient not found: ${recipient}`);
            }

            socket.write("250 OK: Message accepted\r\n");
            
            // Reset for next message
            mailFrom = "";
            rcptTo = "";
            emailData = "";
          } catch (error) {
            log(`Error processing email: ${error}`);
            socket.write("554 Transaction failed\r\n");
          }
        }
        return;
      }

      // Process commands if not in data mode
      const lines = buffer.split("\r\n");
      
      // Process all complete lines except the last one which might be incomplete
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        
        if (line.toUpperCase().startsWith("HELO") || line.toUpperCase().startsWith("EHLO")) {
          socket.write("250 openmail.org\r\n");
        } else if (line.toUpperCase().startsWith("MAIL FROM:")) {
          mailFrom = line.substring(10).trim();
          socket.write("250 OK\r\n");
        } else if (line.toUpperCase().startsWith("RCPT TO:")) {
          rcptTo = line.substring(8).trim();
          // Remove angle brackets if present
          rcptTo = rcptTo.replace(/[<>]/g, "");
          socket.write("250 OK\r\n");
        } else if (line.toUpperCase() === "DATA") {
          dataMode = true;
          socket.write("354 Start mail input; end with <CRLF>.<CRLF>\r\n");
        } else if (line.toUpperCase() === "QUIT") {
          socket.write("221 openmail.org Service closing transmission channel\r\n");
          socket.end();
        } else if (line.toUpperCase() === "RSET") {
          mailFrom = "";
          rcptTo = "";
          socket.write("250 OK\r\n");
        } else if (line.toUpperCase() === "NOOP") {
          socket.write("250 OK\r\n");
        } else {
          socket.write("500 Command unrecognized\r\n");
        }
      }
      
      // Keep the last line in the buffer as it might be incomplete
      buffer = lines[lines.length - 1];
    });

    socket.on("error", (err) => {
      // Only log if it's not an EPIPE error or explicitly log once per connection
      if (!err.message.includes('EPIPE')) {
        log(`SMTP Socket error: ${err.message}`);
      }
    });
  }

  start() {
    this.server.listen(this.port, this.host, () => {
      log(`SMTP server started on port ${this.port}`);
    });
    
    this.server.on("error", (err) => {
      log(`SMTP server error: ${err.message}`);
      
      // If port 25 is restricted (common in non-root environments), 
      // show a warning but don't crash the application
      if (err.message.includes("EACCES") || err.message.includes("EADDRINUSE")) {
        log("Warning: Unable to start SMTP server on port 25. This is normal in restricted environments.");
        log("The application will continue, but won't be able to receive emails directly.");
        log("For testing, use the API endpoints to simulate incoming emails.");
      }
    });
  }
}
