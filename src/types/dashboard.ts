export interface Transaction {
    name: string;
    time: string;
    hash: string;
    status: 'Success' | 'Pending' | 'Failed';
    amount: string;
  }
  
  export interface WalletBalance {
    currency: string;
    amount: number;
    value: number;
    address: string;
  }
  
  export interface CryptoPrice {
    symbol: string;
    price: number;
    change: number;
  }
  
  export interface Contact {
    id: string;
    name: string;
    initial: string;
  }