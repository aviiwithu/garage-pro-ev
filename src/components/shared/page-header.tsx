
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  showBackButton?: boolean;
}

export function PageHeader({ title, description, children, className, showBackButton = false, ...props }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn("flex items-center justify-between space-y-2", className)} {...props}>
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
        )}
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">{title}</h2>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {children}
      </div>
    </div>
  );
}
