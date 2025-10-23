
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function BrandingPage() {
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  const placeholderLogo = "https://placehold.co/240x240/034948/FFF?text=Logo";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 1MB.",
          variant: "destructive"
        });
        return;
      }
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = () => {
    if (logo) {
      // In a real application, this is where you would upload the file to a storage service.
      toast({
        title: "Logo Uploaded",
        description: `${logo.name} has been successfully uploaded.`
      });
    } else {
      toast({
        title: "No Logo Selected",
        description: "Please select a logo to upload first.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    toast({
      title: "Logo Removed",
      description: "The organization logo has been reset."
    });
     // Also clear the file input
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Branding"
        description="Customize the look and feel of your organization's presence."
        showBackButton
      />
      
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Organization Logo</CardTitle>
                <CardDescription>
                    This logo will be displayed in transaction PDFs and email notifications.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-40 h-40 relative flex-shrink-0 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50">
                        <Image 
                            src={logoPreview || placeholderLogo} 
                            alt="Organization Logo Preview" 
                            fill 
                            className="rounded-md object-contain" 
                            data-ai-hint="logo" />
                    </div>
                    <div className="flex-1">
                        <div className="max-w-md space-y-2">
                             <Input id="logo-upload" type="file" onChange={handleFileChange} accept="image/jpeg, image/png, image/gif, image/bmp" />
                             <Button onClick={handleUpload}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Upload Logo
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-4 space-y-1">
                            <p>Preferred Image Dimensions: 240 x 240 pixels @ 72 DPI</p>
                            <p>Supported Files: jpg, jpeg, png, gif, bmp</p>
                            <p>Maximum File Size: 1MB</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="link" className="text-destructive p-0 h-auto" onClick={handleRemoveLogo}>Remove Logo</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                    These preferences will be applied across the app, including the customer and vendor portals.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label>Theme</Label>
                    <div className="flex gap-4 mt-2">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-24 h-16 rounded-md bg-background border-2 border-primary"></div>
                            <p className="text-sm">Light Pane</p>
                        </div>
                         <div className="flex flex-col items-center gap-2">
                            <div className="w-24 h-16 rounded-md bg-gray-800 border-2"></div>
                            <p className="text-sm">Dark Pane</p>
                        </div>
                    </div>
                 </div>
                 <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-10 h-10 rounded-full bg-primary" />
                        <div className="w-10 h-10 rounded-full bg-accent" />
                        <div className="w-10 h-10 rounded-full bg-destructive" />
                        <div className="w-10 h-10 rounded-full bg-blue-500" />
                        <Button variant="outline" size="icon">+</Button>
                    </div>
                 </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button>Save Changes</Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
