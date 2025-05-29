export interface TransactionDetails {
  amount: string;
  currency?: string;
  recipient?: string;
  paymentMethod?: string;
  transactionHash: string;
  date: string;
  receiptNumber: string;
  paymentStatus: string;
  customerName?: string;
  customerEmail?: string;
  items?: { name: string; price: string; quantity: number }[];
  subtotal?: string;
  tax?: string;
  merchantLogo?: string;
  notes?: string;
  status: number;
  failureReason?: string;
  orderId?: string;
}
