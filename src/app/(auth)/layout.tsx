
import { Logo } from '@/components/shared/logo';
import { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
      <div className="relative flex flex-col min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] h-96 w-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-96 w-96 bg-accent/20 rounded-full blur-[100px]" />
        
        <header className="absolute top-0 left-0 right-0 p-4 md:p-6">
             <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" />
                <h1 className="text-xl font.headline font-semibold">GaragePRO<span className="text-primary">EV</span></h1>
            </div>
        </header>
        <main className="w-full z-10">
            {children}
        </main>
      </div>
  )
}
