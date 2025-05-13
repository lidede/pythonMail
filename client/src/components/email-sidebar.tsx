import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { emailService } from "@/lib/email-service";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Settings, ShieldCheck, HelpCircle, PlusCircle, Menu } from "lucide-react";
import { CreateAccountModal } from "./create-account-modal";

interface EmailSidebarProps {
  activeAccountId: number | null;
  onSelectAccount: (accountId: number) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function EmailSidebar({ 
  activeAccountId, 
  onSelectAccount,
  mobileMenuOpen,
  onToggleMobileMenu
}: EmailSidebarProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/accounts'],
    queryFn: emailService.getAccounts,
  });

  return (
    <>
      <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 h-full bg-white border-r border-neutral-200 flex flex-col shadow-sm`}>
        <div className="px-6 py-4 border-b border-neutral-200">
          <h1 className="text-2xl font-semibold text-primary flex items-center">
            <Mail className="mr-2 h-6 w-6" />
            OpenMail
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Open Source Email Server</p>
        </div>
        
        <ScrollArea className="flex-grow">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-medium text-neutral-700 mb-2">Email Accounts</h2>
            
            {isLoading ? (
              <>
                <AccountSkeleton />
                <AccountSkeleton />
                <AccountSkeleton />
              </>
            ) : accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <div 
                  key={account.id}
                  className={`flex items-center p-2 rounded-lg hover:bg-neutral-100 cursor-pointer mb-1 ${activeAccountId === account.id ? 'bg-neutral-100' : ''}`}
                  onClick={() => onSelectAccount(account.id)}
                >
                  <div className={`w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white`}>
                    <span>{account.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{account.email}</p>
                    <p className="text-xs text-neutral-500">
                      {account.unreadCount > 0 
                        ? `${account.unreadCount} unread` 
                        : 'No unread'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-neutral-500">
                <p>No email accounts yet</p>
              </div>
            )}
          </div>
          
          <nav className="p-4">
            <h2 className="font-medium text-neutral-700 mb-2">Navigation</h2>
            <ul>
              <li className="mb-1">
                <a href="#" className="flex items-center p-2 rounded-lg hover:bg-neutral-100 text-primary">
                  <Mail className="mr-2 h-5 w-5" />
                  <span>Inbox</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#" className="flex items-center p-2 rounded-lg hover:bg-neutral-100 text-neutral-700">
                  <Settings className="mr-2 h-5 w-5" />
                  <span>Settings</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#" className="flex items-center p-2 rounded-lg hover:bg-neutral-100 text-neutral-700">
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  <span>Security</span>
                </a>
              </li>
              <li>
                <a href="#" className="flex items-center p-2 rounded-lg hover:bg-neutral-100 text-neutral-700">
                  <HelpCircle className="mr-2 h-5 w-5" />
                  <span>Help</span>
                </a>
              </li>
            </ul>
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-neutral-200">
          <Button 
            className="w-full flex items-center justify-center"
            onClick={() => setCreateModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Account
          </Button>
        </div>
      </aside>
      
      <div className="md:hidden bg-white border-b border-neutral-200 py-3 px-4 flex items-center shadow-sm">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onToggleMobileMenu}
          className="mr-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          OpenMail
        </h1>
      </div>

      <CreateAccountModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onSuccess={() => {
          setCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
        }}
      />
    </>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex items-center p-2 mb-1">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="ml-2 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
