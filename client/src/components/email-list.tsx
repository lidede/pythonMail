import { useQuery } from "@tanstack/react-query";
import { emailService } from "@/lib/email-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { EmailMessage } from "@shared/schema";

interface EmailListProps {
  accountId: number | null;
  selectedEmailId: number | null;
  onSelectEmail: (email: EmailMessage) => void;
}

export function EmailList({ accountId, selectedEmailId, onSelectEmail }: EmailListProps) {
  const { 
    data: emails, 
    isLoading, 
    isError,
    refetch
  } = useQuery({
    queryKey: accountId ? [`/api/accounts/${accountId}/emails`] : null,
    queryFn: () => emailService.getEmails(accountId!),
    enabled: !!accountId,
  });

  const { data: account } = useQuery({
    queryKey: accountId ? [`/api/accounts/${accountId}`] : null,
    queryFn: () => emailService.getAccount(accountId!),
    enabled: !!accountId,
  });

  if (!accountId) {
    return (
      <div className="w-full md:w-1/3 border-r border-neutral-200 bg-white overflow-y-auto flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <Mail className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Account Selected</h3>
        <p>Please select an email account from the sidebar to view messages</p>
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/3 border-r border-neutral-200 bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium truncate">
          {account?.email || 'Loading...'}
        </h3>
        <div className="flex">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-grow">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <EmailSkeleton />
            <EmailSkeleton />
            <EmailSkeleton />
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-neutral-500">
            <p>Failed to load emails. Please try again.</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : emails && emails.length > 0 ? (
          emails.map((email) => (
            <div 
              key={email.id}
              className={`p-3 border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer ${selectedEmailId === email.id ? 'bg-neutral-50' : ''}`}
              onClick={() => onSelectEmail(email)}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm">{email.sender}</div>
                <div className="text-xs text-neutral-500">
                  {formatEmailDate(email.receivedAt)}
                </div>
              </div>
              <div className="font-medium text-sm mb-1">{email.subject}</div>
              <div className="text-xs text-neutral-600 line-clamp-1">
                {email.content}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500 h-full">
            <Mail className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Emails Yet</h3>
            <p>This inbox is empty. Emails sent to this address will appear here.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function formatEmailDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // If it's today, show time
  if (new Date().toDateString() === date.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  
  // If it's within the last week, show "X days ago"
  return formatDistanceToNow(date, { addSuffix: false });
}

function EmailSkeleton() {
  return (
    <div className="p-3 border-b border-neutral-200">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

function Mail(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
