
import { Logo } from '@/components/shared/logo';
import { ReactNode } from 'react';

export default function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
      <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container flex h-16 items-center">
                 <div className="flex items-center gap-2">
                    <Logo className="w-8 h-8" />
                    <h1 className="text-xl font.headline font-semibold">GaragePRO<span className="text-primary">EV</span></h1>
                </div>
            </div>
        </header>
        <main className="flex-1">
            {children}
        </main>
      </div>
  )
}
