import { UserRole } from './constants';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  companyLogo?: string;
}

export interface Borrower {
  id: string;
  nik: string;
  name: string;
  department: string;
  phone: string;
  supervisorName: string;
  supervisorPhone: string;
  isBlocked: boolean;
}

export enum TransactionType { SHOW = 'SHOW', EVENT = 'EVENT', OFF_AIR = 'OFF AIR', LAUNDRY = 'LAUNDRY' }
export enum TransactionStatus { NVL = 'NVL', AVL = 'AVL', PENDING_APPROVAL = 'PENDING_APPROVAL' }
export enum ReturnStatus { COMPLETE = 'COMPLETE', INCOMPLETE = 'INCOMPLETE', PENDING_APPROVAL = 'PENDING_RETURN_APPROVAL' }

export interface ItemDetails {
  photoUrl?: string;
  photoPreview?: string;
  description: string;
  quantity: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  additionalNumber?: string;
  borrowDate: string;
  programName: string;
  transactionType: TransactionType;
  deadlineDate: string;
  item: ItemDetails;
  borrowerId: string;
  borrowerSnapshot: Borrower;
  status: TransactionStatus;
  adminId: string;
  adminUsername?: string;
  borrowerApproved?: boolean;
  returnDetails?: ReturnDetails[];
}

export interface ReturnDetails {
  id: string;
  returnDate: string;
  markedPhotoUrl?: string;
  markedPhotoPreview?: string;
  conditionNotes: string;
  returnedQuantity: number;
  status: ReturnStatus; 
  borrowerApproved?: boolean;
  adminId: string;
}

export interface OutgoingFormData {
  borrowDate: string; programName: string; transactionType: TransactionType; additionalNumber?: string;
  itemDescription: string; itemQuantity: number; itemPhoto?: File;
  borrowerNIK: string; borrowerName: string; borrowerDepartment: string; borrowerPhone: string;
  borrowerSupervisorName: string; borrowerSupervisorPhone: string;
}

export interface IncomingFormData { returnDate: string; returnedQuantity: number; conditionNotes: string; markedPhoto?: File; }
export interface ApprovalFormData { nik: string; phone: string; }

export type CreateTransactionPayload = Omit<Transaction, 'id' | 'transactionNumber' | 'status' | 'deadlineDate' | 'borrowerSnapshot' | 'item'> & {
    item: { description: string; quantity: number; photoPreview: string | null; };
    borrowerSnapshot: Omit<Borrower, 'id' | 'isBlocked'>;
    adminUsername: string;
};

export type CreateReturnPayload = Omit<ReturnDetails, 'id' | 'status' | 'borrowerApproved' | 'markedPhotoUrl'> & {
    markedPhotoPreview: string | null;
};
