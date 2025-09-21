
'use client';

import { useState } from 'react';
import { Complaint } from '@/lib/complaint-data';
import { useComplaint } from '@/context/ComplaintContext';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMemo } from 'react';
import { useEmployee } from '@/context/EmployeeContext';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';

interface AssignTechnicianDialogProps {
  complaint: Complaint;
  onSuccess: () => void;
}

export function AssignTechnicianDialog({ complaint, onSuccess }: AssignTechnicianDialogProps) {
  const { assignTechnician, complaints } = useComplaint();
  const { technicians } = useEmployee();
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');

  const technicianWorkload = useMemo(() => {
    const workload: Record<string, { activeTickets: number }> = {};
    
    technicians.forEach(tech => {
        workload[tech.name] = { activeTickets: 0 };
    });

    complaints.forEach(c => {
        if (c.assignedTo && c.status !== 'Closed' && c.status !== 'Resolved' && workload[c.assignedTo]) {
            workload[c.assignedTo].activeTickets++;
        }
    });

    return workload;
  }, [complaints, technicians]);

  const handleAssign = () => {
    if (selectedTechnician) {
      assignTechnician(complaint.id, selectedTechnician);
      onSuccess();
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
            <ScrollArea className="h-72">
                <RadioGroup onValueChange={setSelectedTechnician} className="p-1">
                    <div className="space-y-2">
                        {technicians.map(tech => (
                            <Label key={tech.id} htmlFor={tech.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                <div className="flex items-center gap-4">
                                    <RadioGroupItem value={tech.name} id={tech.id} className="border-primary-foreground" />
                                    <div>
                                        <p className="font-semibold">{tech.name}</p>
                                        <p className="text-sm text-primary-foreground/80">{tech.specialization}</p>
                                    </div>
                                </div>
                                <p className="text-sm">
                                    {technicianWorkload[tech.name]?.activeTickets || 0} active tickets
                                </p>
                            </Label>
                        ))}
                    </div>
                </RadioGroup>
            </ScrollArea>
        </CardContent>
      </Card>
      <DialogFooter className="pt-4">
        <Button onClick={handleAssign} disabled={!selectedTechnician}>
          Assign Technician
        </Button>
      </DialogFooter>
    </>
  );
}
