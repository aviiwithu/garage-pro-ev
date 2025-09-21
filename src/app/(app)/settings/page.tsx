
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';

const settingsConfig = [
  {
    category: 'Organization Settings',
    id: 'org',
    items: [
      { name: 'Organization Profile', id: 'org-profile', href: '#' },
      { name: 'Branding', id: 'org-branding', href: '/settings/branding' },
      { name: 'Branches', id: 'org-branches', href: '/settings/branches' },
      { name: 'Custom Domain', id: 'org-domain', href: '#' },
      { name: 'Manage Subscription', id: 'org-subscription', href: '#' },
    ],
  },
  {
    category: 'Users & Roles',
    id: 'users',
    items: [
      { name: 'Users', id: 'users-manage', href: '#' },
      { name: 'Roles', id: 'users-roles', href: '#' },
      { name: 'User Preferences', id: 'users-prefs', href: '#' },
    ],
  },
  {
    category: 'Taxes & Compliance',
    id: 'taxes',
    items: [
      { name: 'Taxes', id: 'taxes-rates', href: '#' },
      { name: 'Direct Taxes', id: 'taxes-direct', href: '#' },
      { name: 'e-Way Bills', id: 'taxes-eway', href: '#' },
      { name: 'e-Invoicing', id: 'taxes-einvoicing', href: '#' },
      { name: 'MSME Settings', id: 'taxes-msme', href: '#' },
    ],
  },
    {
    category: 'Setup & Configurations',
    id: 'setup',
    items: [
      { name: 'General', id: 'setup-general', href: '#' },
      { name: 'Currencies', id: 'setup-currencies', href: '#' },
      { name: 'Opening Balances', id: 'setup-balances', href: '#' },
      { name: 'Reminders', id: 'setup-reminders', href: '#' },
      { name: 'Customer Portal', id: 'setup-customer-portal', href: '/settings/customer-portal' },
      { name: 'Vendor Portal', id: 'setup-vendor-portal', href: '#' },
    ],
  },
  {
    category: 'Customisation',
    id: 'customisation',
    items: [
      { name: 'Transaction Number Series', id: 'cust-tx-series', href: '#' },
      { name: 'PDF Templates', id: 'cust-pdf', href: '#' },
      { name: 'Email Notifications', id: 'cust-email', href: '#' },
      { name: 'SMS Notifications', id: 'cust-sms', href: '#' },
      { name: 'Reporting Tags', id: 'cust-tags', href: '#' },
      { name: 'Web Tabs', id: 'cust-webtabs', href: '#' },
      { name: 'Digital Signature', id: 'cust-signature', href: '#' },
      { name: 'WhatsApp Templates', id: 'cust-whatsapp', href: '#' },
    ],
  },
  {
    category: 'Automation',
    id: 'automation',
    items: [
      { name: 'Workflow Rules', id: 'auto-rules', href: '#' },
      { name: 'Workflow Actions', id: 'auto-actions', href: '#' },
      { name: 'Workflow Logs', id: 'auto-logs', href: '#' },
    ],
  },
    {
    category: 'Module Settings',
    id: 'modules',
    items: [
      { name: 'General', id: 'mod-general', href: '#' },
      { name: 'Customers and Vendors', id: 'mod-customers', href: '#' },
      { name: 'Items', id: 'mod-items', href: '#' },
      { name: 'Accountant', id: 'mod-accountant', href: '#' },
      { name: 'Projects', id: 'mod-projects', href: '#' },
      { name: 'Timesheet', id: 'mod-timesheet', href: '#' },
      { name: 'Inventory', id: 'mod-inventory', href: '#' },
      { name: 'Inventory Adjustments', id: 'mod-inv-adj', href: '#' },
    ],
  },
  {
    category: 'Online Payments',
    id: 'payments',
    items: [
      { name: 'Customer Payments', id: 'pay-customer', href: '#' },
      { name: 'Vendor Payments', id: 'pay-vendor', href: '#' },
    ],
  },
  {
    category: 'Sales',
    id: 'sales',
    items: [
      { name: 'Quotes', id: 'sales-quotes', href: '#' },
      { name: 'Retainer Invoices', id: 'sales-retainer', href: '#' },
      { name: 'Sales Orders', id: 'sales-orders', href: '#' },
      { name: 'Delivery Challans', id: 'sales-challans', href: '#' },
      { name: 'Invoices', id: 'sales-invoices', href: '#' },
      { name: 'Recurring Invoices', id: 'sales-recurring', href: '#' },
      { name: 'Payments Received', id: 'sales-payments', href: '#' },
      { name: 'Credit Notes', id: 'sales-credit', href: '#' },
      { name: 'Delivery Notes', id: 'sales-delivery', href: '#' },
      { name: 'Packing Slips', id: 'sales-packing', href: '#' },
    ],
  },
  {
    category: 'Purchases',
    id: 'purchases',
    items: [
      { name: 'Expenses', id: 'purch-expenses', href: '#' },
      { name: 'Purchase Orders', id: 'purch-orders', href: '#' },
      { name: 'Bills', id: 'purch-bills', href: '#' },
      { name: 'Payments Made', id: 'purch-payments', href: '#' },
      { name: 'Vendor Credits', id: 'purch-credits', href: '#' },
    ],
  },
  {
    category: 'Extension and Developer Data',
    id: 'developer',
    items: [
      { name: 'Integrations & Marketplace', id: 'dev-integrations', href: '#' },
      { name: 'Zoho Apps', id: 'dev-zoho', href: '#' },
      { name: 'WhatsApp', id: 'dev-whatsapp', href: '#' },
      { name: 'SMS Integrations', id: 'dev-sms', href: '#' },
      { name: 'Uber for Business', id: 'dev-uber', href: '#' },
      { name: 'Other Apps', id: 'dev-other-apps', href: '#' },
      { name: 'Marketplace', id: 'dev-marketplace', href: '#' },
      { name: 'Incoming Webhooks', id: 'dev-webhooks', href: '#' },
      { name: 'Connections', id: 'dev-connections', href: '#' },
      { name: 'API Usage', id: 'dev-api', href: '#' },
      { name: 'Data Management', id: 'dev-data', href: '#' },
    ],
  },
];

export default function SettingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(settingsConfig[0].id);

  const filteredConfig = settingsConfig.map(category => ({
    ...category,
    items: category.items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
  })).filter(category => category.items.length > 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="All Settings"
        description="Manage your organization's settings and preferences."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-1 space-y-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search settings..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <nav className="space-y-1">
                {filteredConfig.map(category => (
                     <a
                        key={category.id}
                        href={`#${category.id}`}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                            'block rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
                            activeCategory === category.id ? 'bg-muted' : 'bg-transparent'
                        )}
                        >
                        {category.category}
                    </a>
                ))}
            </nav>
        </div>
        
        {/* Right Content */}
        <div className="md:col-span-3 space-y-8">
            {filteredConfig.map(category => (
                <div id={category.id} key={category.id} className="scroll-mt-20">
                    <h2 className="text-2xl font-bold font-headline mb-4">{category.category}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.items.map(item => (
                            <Link href={item.href} key={item.id} className="block">
                                <Card className="hover:shadow-md transition-shadow h-full">
                                    <CardHeader>
                                        <CardTitle className="text-base">{item.name}</CardTitle>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
