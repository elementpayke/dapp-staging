import type { ReactNode } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormHandleSubmit,
  ValidationRule,
} from "react-hook-form";

export type InstitutionProps = {
  name: string;
  code: string;
  type: string;
};

export type FormData = {
  network: string;
  token: string;
  amount: number;
  currency: string;
  institution: string;
  accountIdentifier: string;
  recipientName: string;
  memo: string;
};

export type FormMethods = {
  handleSubmit: UseFormHandleSubmit<FormData, undefined>;
  register: UseFormRegister<FormData>;
  watch: (name: string) => string | number | undefined;
  formState: {
    errors: FieldErrors<FormData>;
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
  };
};

export type TransactionFormProps = {
  onSubmit: (data: FormData) => Promise<void>;
  formMethods: FormMethods;
  stateProps: StateProps;
};

export type TransactionPreviewProps = {
  handleBackButtonClick: () => void;
  stateProps: StateProps;
};

export type TransactionStatus = 
  | "idle"
  | "pending"
  | "processing"
  | "fulfilled"
  | "validated"
  | "settled"
  | "refunded";

export type TransactionStatusProps = {
  transactionStatus: TransactionStatus;
  recipientName: string;
  orderId: string;
  createdAt: string;
  clearForm: () => void;
  clearTransactionStatus: () => void;
  setTransactionStatus: (status: TransactionStatus) => void;
  formMethods: FormMethods;
};

export type SelectFieldProps = {
  id: string;
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  validation: Record<string, ValidationRule>;
  errors: FieldErrors<FormData>;
  register: UseFormRegister<FormData>;
  isLoading?: boolean;
  value?: string | number | undefined;
  defaultValue?: string;
  title?: string;
};

export type VerifyAccountPayload = {
  institution: string;
  accountIdentifier: string;
};

export type RatePayload = {
  token: string;
  amount?: number;
  currency: string;
};

export type RateResponse = {
  status: string;
  data: number;
  message: string;
};

export type PubkeyResponse = {
  status: string;
  data: string;
  message: string;
};



export interface OrderStatusAPIData {
  order_id: string;
  status: OrderStatus;
}

export interface OrderStatusResponse {
  status: string;
  message: string;
  data: OrderStatusAPIData;
}
export type OrderStatus =
  | "pending"
  | "processing"
  | "complete"
  | "failed"
  | "settled"
  | "refunded";

export type StateProps = {
  formValues: FormData;
  tokenBalance: number;
  smartTokenBalance: number;
  rate: number;
  isFetchingRate: boolean;
  recipientName: string;
  isFetchingRecipientName: boolean;
  institutions: InstitutionProps[];
  isFetchingInstitutions: boolean;
  selectedTab: string;
  handleTabChange: (tab: string) => void;
  selectedNetwork: string;
  handleNetworkChange: (network: string) => void;
  setCreatedAt: (createdAt: string) => void;
  setOrderId: (orderId: string) => void;
  setTransactionStatus: (status: TransactionStatus) => void;
};

export type NetworkButtonProps = {
  network: string;
  logo: string;
  alt: string;
  selectedNetwork: string;
  handleNetworkChange: (network: string) => void;
  disabled?: boolean;
};

export type TabButtonProps = {
  tab: string;
  selectedTab: string;
  handleTabChange: (tab: string) => void;
};

export type AnimatedComponentProps = {
  children: ReactNode;
  variant?: {
    initial: Record<string, number>;
    animate: Record<string, number | { type: string; stiffness: number; damping: number }>;
    exit: Record<string, number | { type: string; stiffness: number; damping: number }>;
  };
  className?: string;
  delay?: number;
};

export type bounceInOut = {
  initial: { scale: number; opacity: number };
  animate: { 
    scale: number;
    opacity: number;
    transition: { type: string; stiffness: number; damping: number };
  };
  exit: {
    scale: number;
    opacity: number;
    transition: { type: string; stiffness: number; damping: number };
  };
};

export type Token = {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
};

export type Order = {
  order_id: string;
  status: "pending" | "processing" | "complete" | "failed" | "settled" | "refunded";
  amount_crypto: number;
  amount_fiat: number;
  currency: string;
  exchange_rate?: number;
  token: string;
  invoice_id?: string;
  file_id?: string;
  phone_number?: string;
  creation_transaction_hash?: string;
  settlement_transaction_hash?: string;
  refund_transaction_hash?: string;
  order_type: 0 | 1; // 0 = OnRamp, 1 = OffRamp
  wallet_address?: string;
  created_at: string;
  updated_at?: string;
};

export type Tx = {
  id: string;
  name: string;
  time: string;
  hash: string;
  fullHash: string;
  status: string;
  description: string;
  amount: string;
};
