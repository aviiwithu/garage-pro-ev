
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <SearchX className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-5xl font-bold font-headline tracking-tighter">404</CardTitle>
          <CardDescription className="text-xl">Page Not Found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Oops! The page you are looking for does not exist. It might have been moved or deleted.
          </p>
          <Button asChild>
            <Link href="/">Go Back Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
