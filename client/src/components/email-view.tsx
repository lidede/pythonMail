import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { emailService } from "@/lib/email-service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Reply, Forward, Trash, MoreVertical, Mail, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { EmailMessage } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailViewProps {
  selectedEmailId: number | null;
}

export function EmailView({ selectedEmailId }: EmailViewProps) {
  const { 
    data: email, 
    isLoading,
    isError,
  } = useQuery({
    queryKey: selectedEmailId ? [`/api/emails/${selectedEmailId}`] : null,
    queryFn: () => emailService.getEmail(selectedEmailId!),
    enabled: !!selectedEmailId,
  });

  if (!selectedEmailId) {
    return <NoEmailSelected />;
  }

  if (isLoading) {
    return <EmailViewSkeleton />;
  }

  if (isError || !email) {
    return (
      <div className="flex-1 bg-white overflow-y-auto flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
        <h3 className="text-lg font-medium mb-2">Failed to load email</h3>
        <p>There was an error loading this email. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium">Message View</h3>
        <div className="flex">
          <Button variant="ghost" size="icon" title="Reply">
            <Reply className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="Forward">
            <Forward className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete">
            <Trash className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" title="More options">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-grow">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">{email.subject}</h2>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                  <span>{email.sender.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-medium">{email.sender}</div>
                  <div className="text-sm text-neutral-500">&lt;{email.senderEmail}&gt;</div>
                </div>
              </div>
              <div className="text-sm text-neutral-500">
                {formatDetailedDate(email.receivedAt)}
              </div>
            </div>
            
            <div className="text-sm text-neutral-500 mb-1">To: {email.recipient}</div>
          </div>
          
          <div className="border-t border-neutral-200 pt-6">
            {/* Email body */}
            {email.htmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.htmlContent) }} className="prose max-w-none" />
            ) : (
              <div className="prose max-w-none whitespace-pre-wrap">{email.content}</div>
            )}
            
            {/* Magic Links Section */}
            {email.magicLinks && email.magicLinks.length > 0 && (
              <div className="mt-8 border-t border-neutral-200 pt-6">
                <h4 className="font-medium text-neutral-700 mb-4">Magic Links Detected</h4>
                <div className="space-y-3">
                  {email.magicLinks.map((link, index) => (
                    <MagicLink key={index} link={link} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function MagicLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <Alert>
      <AlertDescription className="flex flex-col">
        <div className="font-mono text-sm break-all bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-2">
          {link}
        </div>
        <div className="flex gap-2 self-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyToClipboard}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.open(link, '_blank')}
                >
                  Open Link
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in new tab</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function NoEmailSelected() {
  return (
    <div className="flex-1 bg-white overflow-y-auto flex flex-col items-center justify-center p-6 text-center text-neutral-500">
      <Mail className="h-12 w-12 mb-4" />
      <h3 className="text-lg font-medium mb-2">No Email Selected</h3>
      <p>Select an email from the list to view its contents</p>
    </div>
  );
}

function EmailViewSkeleton() {
  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium">Message View</h3>
        <div className="flex space-x-1">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      
      <div className="p-6">
        <Skeleton className="h-8 w-3/4 mb-6" />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start">
            <Skeleton className="w-10 h-10 rounded-full mr-3" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        
        <Skeleton className="h-4 w-48 mb-6" />
        
        <div className="border-t border-neutral-200 pt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

function formatDetailedDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, "MMMM d, yyyy 'at' h:mm a");
}

// Very basic HTML sanitizer - in a real app, use a library like DOMPurify
function sanitizeHtml(html: string): string {
  // This is a very simplistic approach - use a proper sanitizer in production
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, 'blocked:')
    .replace(/on\w+=/gi, 'data-blocked=');
}

function AlertCircle(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
