export interface TransactionDetails {
  amount: string;
  currency?: string;
  recipient?: string;
  paymentMethod?: string;
  transactionHash: string;
  date: string;
  receiptNumber: string;
  mpesa_receipt_number?: string; // Add M-Pesa specific receipt number
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
export interface OrderStatusAPIData {
  amount_fiat: number;
  created_at: string;
  currency: string;
  failure_reason: string | null;
  file_id: string;
  mpesa_receipt_number: string | null;
  order_id: string;
  order_type: string;
  receipt_number: string | null;
  receiver_name: string | null;
  status: string;
  token: string;
  transaction_hashes: {
    creation: string | null;
    settlement: string | null;
    refund: string | null;
  };
  wallet_address: string;
  phone_number?: string;
}

export interface OrderStatusResponse {
  status: string;
  message: string;
  data: OrderStatusAPIData;
}


export interface ProcessingPopupProps {
  isVisible: boolean;
  onClose: () => void;
  orderId: string;
  apiKey: string;
  transactionDetails: TransactionDetails;
  branding?: {
    primaryColor: string;
    logo?: string;
    companyName: string;
    footerMessage?: string;
    receiptTitle?: string;
  };
  sendReceiptEmail?: (email: string, receiptData: any) => Promise<boolean>;
}