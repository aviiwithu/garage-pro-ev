
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthProvider';
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Car,
  FilePlus,
  ClipboardList,
  History,
  FileBox,
  FileClock,
  Warehouse,
  UserCog,
  Loader2,
  PanelLeft,
  DollarSign,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  BrainCircuit,
  Users2,
  ScrollText,
  ShoppingCart,
  Building,
  FilePen,
  Package,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/shared/logo';
import { useSidebar } from '@/components/ui/sidebar';


const adminNavItems = [
    {
        group: 'General',
        items: [
          { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { href: '/data-insights', icon: BrainCircuit, label: 'Data Insights' },
        ]
    },
    {
        group: 'Operations',
        items: [
            { href: '/operations/service-tickets', icon: FilePlus, label: 'New Ticket' },
            { href: '/operations/complaint-dashboard', icon: ClipboardList, label: 'Complaint Dashboard' },
            { href: '/operations/maintenance', icon: Car, label: 'Predictive Maintenance' },
            { href: '/operations/drivers', icon: Users, label: 'Driver Behavior' },
            { href: '/operations/inventory', icon: Warehouse, label: 'Inventory' },
            { href: '/operations/documents', icon: FileBox, label: 'Documents' },
            { href: '/operations/alerts', icon: Bell, label: 'Alerts' },
        ]
    },
    {
        group: 'Sales',
        items: [
            { href: '/sales/quotes', icon: FilePen, label: 'Quotes' },
            { href: '/sales/sales-orders', icon: Package, label: 'Sales Orders' },
        ]
    },
    {
        group: 'Human Resources',
        items: [
            { href: '/human-resources/employees', icon: Users2, label: 'Employees' },
            { href: '/human-resources/technicians', icon: UserCog, label: 'Technicians' },
            { href: '/human-resources/attendance', icon: CalendarCheck, label: 'Attendance' },
            { href: '/human-resources/productivity', icon: TrendingUp, label: 'Productivity' },
        ]
    },
    {
        group: 'Finance',
        items: [
             { href: '/finance/accounting', icon: DollarSign, label: 'Accounting' },
             { href: '/finance/invoices', icon: FileText, label: 'Invoices' },
             { href: '/finance/purchases', icon: ShoppingCart, label: 'Purchases' },
             { href: '/finance/reports', icon: ScrollText, label: 'Reports' },
        ]
    },
    {
        group: 'Customers',
        items: [
            { href: '/customers', icon: Users, label: 'Customers' },
            { href: '/customers/amc', icon: FileClock, label: 'AMCs' },
        ]
    },
    {
        group: 'Vendor Management',
        items: [
            { href: '/vendors/management', icon: Building, label: 'Vendor Directory' },
            { href: '/vendors/performance', icon: TrendingUp, label: 'Performance' },
            { href: '/vendors/contracts', icon: FileText, label: 'Contracts' },
        ]
    }
];

const customerNavItems = [
    {
        group: 'My Portal',
        items: [
            { href: '/customers/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/operations/service-tickets', icon: FilePlus, label: 'New Service Ticket' },
            { href: '/customers/service-history', icon: History, label: 'My Service History' },
            { href: '/customers/amc', icon: FileClock, label: 'My AMCs' },
        ]
    }
];

const technicianNavItems = [
    {
        group: 'My Work',
        items: [
            { href: '/human-resources/attendance', icon: CalendarCheck, label: 'My Attendance' },
            { href: '/operations/complaint-dashboard', icon: ClipboardList, label: 'My Tickets' },
            { href: '/human-resources/productivity', icon: TrendingUp, label: 'My Productivity' },
        ]
    }
];


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading, isAuthenticated, role, viewAsRole } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);
  
  if (loading || !isAuthenticated) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  const handleLogout = async () => {
    await logout();
  };

  const effectiveRole = viewAsRole || role;
  
  let navItems;
  if (effectiveRole === 'customer') {
    navItems = customerNavItems;
  } else if (effectiveRole === 'technician') {
    navItems = technicianNavItems;
  } else {
    navItems = adminNavItems;
  }


  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <h1 className="text-xl font.headline font-semibold">GaragePRO EV</h1>
          </div>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((group) => (
              <React.Fragment key={group.group}>
                <SidebarGroup>
                    <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
                    {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton
                            isActive={pathname.startsWith(item.href)}
                            tooltip={item.label}
                            >
                            <item.icon />
                            <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarGroup>
                <SidebarSeparator />
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <div className="flex items-center gap-2 p-2">
              <Avatar className="h-9 w-9">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="logo" />
                  <AvatarFallback>{user?.name?.charAt(0) ?? 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                  <span className="text-sm font-semibold text-sidebar-foreground">{user?.name || 'Admin'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
           </div>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleSidebar} tooltip={state === 'expanded' ? 'Collapse' : 'Expand'}>
                <PanelLeft />
                <span>{state === 'expanded' ? 'Collapse' : 'Expand'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/settings">
                    <SidebarMenuButton isActive={pathname.startsWith('/settings')} tooltip="Settings">
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
