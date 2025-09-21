
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Trash2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';

type DocumentFile = {
    id: string;
    name: string;
    description: string;
    location: string;
    logDate: string; // Should be ISO string
}


export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDocName, setNewDocName] = useState('');
    const [newDocDesc, setNewDocDesc] = useState('');
    const [newDocLocation, setNewDocLocation] = useState('');
    const [logging, setLogging] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'documents'), (snapshot) => {
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentFile));
            setDocuments(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching documents:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    

    const handleLogDocument = async () => {
        if (!newDocName || !newDocDesc || !newDocLocation) {
            toast({ title: "Missing Information", description: "Please fill in all fields to log a document.", variant: "destructive" });
            return;
        }

        setLogging(true);
        try {
            const docData = {
                name: newDocName,
                description: newDocDesc,
                location: newDocLocation,
                logDate: new Date().toISOString(),
            };
            await addDoc(collection(db, 'documents'), docData);

            toast({
                title: "Document Logged",
                description: `${newDocName} has been successfully logged.`,
            });
            setNewDocName('');
            setNewDocDesc('');
            setNewDocLocation('');

        } catch (error) {
            console.error("Error logging document:", error);
             toast({ title: "Logging Failed", description: "Could not log the document.", variant: "destructive" });
        } finally {
            setLogging(false);
        }
    }


    const handleDelete = async (docId: string) => {
        try {
            await deleteDoc(doc(db, 'documents', docId));
            toast({
                title: "Document Log Deleted",
                description: "The document log has been successfully removed.",
            });
        } catch (error) {
            console.error("Error deleting document log:", error);
            toast({
                title: "Error",
                description: "Failed to delete the document log.",
                variant: "destructive",
            });
        }
    }


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Document Log"
        description="Centralized repository for logging all fleet-related documents."
      />

      <Card>
        <CardHeader>
          <CardTitle>Log New Document</CardTitle>
          <CardDescription>Enter details of a document to log its existence and location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Document Name (e.g., Insurance PDF)" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} />
                <Input placeholder="Description (e.g., Policy #XYZ)" value={newDocDesc} onChange={(e) => setNewDocDesc(e.target.value)} />
                <Input placeholder="Physical or Digital Location" value={newDocLocation} onChange={(e) => setNewDocLocation(e.target.value)} />
            </div>
            <Button onClick={handleLogDocument} disabled={logging}>
                {logging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Log Document
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Document Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
             {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : documents.map((doc) => (
                <div key={doc.id} className="flex items-center p-3 border rounded-lg">
                    <FileText className="h-6 w-6 mr-4 text-primary" />
                    <div className="flex-1">
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                           {doc.description} | Location: {doc.location} | Logged: {new Date(doc.logDate).toLocaleDateString()}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            {!loading && documents.length === 0 && (
                <p className="text-center text-muted-foreground">No documents logged yet.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
