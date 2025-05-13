import { useState } from "react";
import { EmailSidebar } from "@/components/email-sidebar";
import { EmailList } from "@/components/email-list";
import { EmailView } from "@/components/email-view";
import { EmailMessage } from "@shared/schema";
import { Mail, Settings, ShieldCheck, User } from "lucide-react";

export default function Home() {
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSelectAccount = (accountId: number) => {
    setActiveAccountId(accountId);
    setSelectedEmail(null);
    setMobileMenuOpen(false);
  };
  
  const handleSelectEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    // Close mobile menu when selecting an email
    setMobileMenuOpen(false);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <EmailSidebar 
          activeAccountId={activeAccountId} 
          onSelectAccount={handleSelectAccount}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={toggleMobileMenu}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <EmailList 
              accountId={activeAccountId} 
              selectedEmailId={selectedEmail?.id || null}
              onSelectEmail={handleSelectEmail}
            />
            
            <EmailView 
              selectedEmailId={selectedEmail?.id || null} 
            />
          </div>
          
          {/* Mobile bottom nav */}
          <div className="md:hidden bg-white border-t border-neutral-200 flex justify-around py-2">
            <button className="p-2 flex flex-col items-center text-primary">
              <Mail className="h-5 w-5" />
              <span className="text-xs mt-1">Inbox</span>
            </button>
            <button className="p-2 flex flex-col items-center text-neutral-500">
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Settings</span>
            </button>
            <button className="p-2 flex flex-col items-center text-neutral-500">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs mt-1">Security</span>
            </button>
            <button className="p-2 flex flex-col items-center text-neutral-500">
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
