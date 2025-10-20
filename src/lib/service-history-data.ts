
export type ServiceRecord = {
    id: string;
    complaintId: string;
    vehicleNumber: string;
    date: string; // ISO Date string
    servicePerformed: string;
    technician: string;
    cost: number;
}
