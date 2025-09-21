
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bell, Info, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Alert = {
    id: string;
    type: 'Critical' | 'Warning' | 'Info' | 'Resolved';
    message: string;
    timestamp: string; // Should be an ISO string
}

const alertConfig = {
    Critical: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' },
    Warning: { icon: Bell, color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
    Info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    Resolved: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' },
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'alerts'), (snapshot) => {
            const alertList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
            setAlerts(alertList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching alerts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="System Alerts"
        description="View all system-generated alerts and notifications."
      />
      
      <Card>
        <CardHeader>
            <CardTitle>Alerts Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : alerts.length > 0 ? (
                alerts.map(alert => {
                    const config = alertConfig[alert.type];
                    const Icon = config.icon;
                    return (
                        <div key={alert.id} className={`flex items-start p-4 rounded-lg border ${config.bgColor}`}>
                            <Icon className={`h-6 w-6 mr-4 mt-1 ${config.color}`} />
                            <div className="flex-1">
                                <p className={`font-semibold ${config.color}`}>{alert.type}</p>
                                <p className="text-foreground">{alert.message}</p>
                                <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    )
                })
            ) : (
                 <p className="text-center text-muted-foreground">No alerts to display.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
