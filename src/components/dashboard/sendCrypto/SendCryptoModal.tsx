import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import PayToBank from "./PayToBank";
import PayToMobileMoney from "./PayToMobileMoney";
import PaymentProcessing from "./PaymentProcessingPopup"; // Import the component

import { parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { erc20Abi } from "@/app/api/abi";
import { getUSDCAddress } from '../../../services/tokens';
import { useContract } from "@/services/useContract";
import { useWallet } from "@/context/WalletContext";
import { encryptMessage } from "@/services/encryption";


interface SendCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  icon: string;
  selected?: boolean;
}

const SendCryptoModal: React.FC<SendCryptoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [paymentType, setPaymentType] = useState<"bank" | "mobile">("bank");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("Equity Bank");
  const [accountNumber, setAccountNumber] = useState("1170398667889");
  const [mobileNumber, setMobileNumber] = useState("0703417782");
  const [reason, setReason] = useState("Transport");
  const [favorite, setFavorite] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<string>("metamask");
  const [isApproving, setIsApproving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { usdcBalance } = useWallet(); 

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const MARKUP_PERCENTAGE = 1.5; // 1.5% markup

  // Fetch exchange rate from Coinbase API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coinbase.com/v2/exchange-rates?currency=USDC"
        );
        const data = await response.json();
        if (data?.data?.rates?.KES) {
          const baseRate = parseFloat(data.data.rates.KES);
          const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
          setExchangeRate(markupRate);
        } else {
          console.error("KES rate not found");
          setExchangeRate(null);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        setExchangeRate(null);
      }
    };

    fetchExchangeRate();
  }, []);
  const calculateUSDCAmount = () => {
    if (!exchangeRate) return 0; // Prevent errors if exchange rate is unavailable
    const kesAmount = parseFloat(amount) || 0;
    return (kesAmount / exchangeRate).toFixed(6); // Convert KES to USDC
  };
  
  // Get the USDC amount needed
  const usdcAmount = calculateUSDCAmount();
  

  // Wallet and balance constants (these would typically come from your wallet integration)
  const WALLET_BALANCE = 19807.90;
  const USDC_BALANCE = 0.0000246;

  
  const TRANSACTION_FEE_RATE = 0.005; // 0.5%

  const transactionSummary = useMemo(() => {
    if (!exchangeRate) {
      return {
        kesAmount: 0,
        usdcAmount: 0,
        transactionCharge: 0,
        totalUSDC: 0,
        totalKES: 0,
        totalKESBalance: 0,
        walletBalance: 0,
        remainingBalance: 0,
        usdcBalance: 0,
      };
    }
  
    const kesAmount = parseFloat(amount) || 0;
    const usdcAmount = kesAmount / exchangeRate;
    const transactionCharge = usdcAmount * TRANSACTION_FEE_RATE;
    const totalUSDC = usdcAmount + transactionCharge;
    const remainingBalance = usdcBalance - totalUSDC;
    const totalKES = usdcBalance * exchangeRate;
    const totalKESBalance = totalKES - kesAmount;
  
    return {
      kesAmount,
      usdcAmount,
      transactionCharge,
      totalUSDC,
      totalKES,
      totalKESBalance: totalKESBalance,
      walletBalance: parseFloat(amount) || 0, // Assuming the amount is in KES
      remainingBalance: Math.max(remainingBalance, 0), // Remaining balance after spending
      usdcBalance: usdcBalance, // ✅ Use fetched USDC balance
    };
  }, [amount, exchangeRate, usdcBalance]);

  console.log(`TransactionSummary: ${JSON.stringify(transactionSummary, null, 2)}`);


  const account = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
  const { contract, address } = useContract();
  const phoneNumber = mobileNumber;
  const account_number = accountNumber;

  const amountToPay = parseFloat(amount);
  const reasonForPayment = reason;
  const bankName = bank;

  let messageHash = "";
  try {
    messageHash = encryptMessage(mobileNumber, "KES", exchangeRate ?? 0, transactionSummary.totalUSDC);
  } catch (error) {
    toast.error("Encryption failed.");
    console.error("Error encrypting message:", error);
    return;
  }

  //@TODO: Joe query the contract address from the env
  const smartcontractaddress = "0x10af11060bC238670520Af7ca15E86a34bC68fe4";

  const handleApproveToken = async () => {
    if (!account.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    try {
      setIsApproving(true);

      const tokenAddress = usdcTokenAddress;
      const spenderAddress = smartcontractaddress as `0x${string}`;
      if (!spenderAddress) {
        toast.error("Spender address is not defined");
        return;
      }
      const orderType = 1;

      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          spenderAddress,
          parseUnits(transactionSummary.totalUSDC.toString(), 6),
        ],
      });

      try {
        if (!contract) throw new Error("Contract is not initialized.");
        // Call the createOrder function on your contract
        const tx = await contract.createOrder(
          address,
          parseUnits(transactionSummary.totalUSDC.toString(), 6),
          usdcTokenAddress,
          orderType,
          messageHash
        );
        console.log(`Transaction hash: ${tx.hash}`);
        toast.info("Transaction submitted. Awaiting confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);
        toast.success("Order created successfully!");
        onClose();
      } catch (error: any) {
        console.error("Error creating order:", error.tx);
        toast.error(error?.message || "Transaction failed.");
      } finally {
        setIsApproving(false);

        //set is processing to true
        setIsProcessing(true);
      }

    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error?.shortMessage || "Failed to approve token");
    } finally {
      setIsApproving(false);
      setIsProcessing(true);

    }
  };

  const walletOptions: WalletOption[] = [
    { id: "metamask", icon: "🦊", selected: selectedWallet === "metamask" },
    { id: "coinbase", icon: "©️", selected: selectedWallet === "coinbase" },
    { id: "qr", icon: "🔲", selected: selectedWallet === "qr" },
  ];
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment process (replace with actual logic)
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success("Payment processed successfully!");
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // if (!isOpen) return null;
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50"
      onClick={handleClose}
    >
      <div className="bg-white w-full h-full md:h-auto md:rounded-3xl md:max-w-4xl overflow-auto">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="md:hidden p-1" type="button">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Spend Crypto
              </h2>
            </div>
            <button
              onClick={onClose}
              className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Left Column - Form */}
            <div className="md:col-span-3 space-y-4">
              {/* Payment Type Selection */}
              <div className="flex gap-3">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    paymentType === "bank"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setPaymentType("bank")}
                  type="button"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    {paymentType === "bank" && (
                      <div className="w-2 h-2 bg-current rounded-full" />
                    )}
                  </div>
                  Pay to Bank
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    paymentType === "mobile"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setPaymentType("mobile")}
                  type="button"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    {paymentType === "mobile" && (
                      <div className="w-2 h-2 bg-current rounded-full" />
                    )}
                  </div>
                  Pay to Mobile Money
                </button>
              </div>

              {/* Wallet Selection */}
              {paymentType === "bank" && (
                <div>
                  <label className="block text-gray-600 mb-2">
                    Select wallet to pay from
                  </label>
                  <div className="flex gap-2">
                    {walletOptions.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => setSelectedWallet(wallet.id)}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
                          selectedWallet === wallet.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        type="button"
                      >
                        {wallet.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Form */}
              {paymentType === "bank" ? (
                <PayToBank
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  amount={amount}
                  setAmount={setAmount}
                  bank={bank}
                  setBank={setBank}
                  accountNumber={accountNumber}
                  setAccountNumber={setAccountNumber}
                  reason={reason}
                  setReason={setReason}
                />
              ) : (
                <PayToMobileMoney
                  selectedToken={selectedToken}
                  setSelectedToken={setSelectedToken}
                  amount={amount}
                  setAmount={setAmount}
                  mobileNumber={mobileNumber}
                  setMobileNumber={setMobileNumber}
                  reason={reason}
                  setReason={setReason}
                  totalKES={transactionSummary.totalKES}
                />
              )}

              {/* Favorite Option */}
              <div className="flex items-center gap-2">
                <input
                  id="favorite"
                  type="checkbox"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="favorite" className="text-gray-600 text-sm">
                  Favorite this payment details for future transactions
                </label>
              </div>

              {/* Mobile View Confirm Button */}
              <button
                type="button"
                className="w-full md:hidden mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium"
              >
                Confirm Payment
              </button>
            </div>


          {/* Payment Processing Popup */}
          {/* <PaymentProcessing
            isVisible={isProcessing}
            onClose={() => setIsProcessing(false)}
          /> */}
            {/* Right Column - Transaction Summary (Hidden on Mobile) */}
            <div className="hidden md:block md:col-span-2 bg-gray-50 p-4 rounded-2xl h-fit">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Transaction summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wallet balance</span>
                  <span className="text-green-600 font-medium">
                  USDC {transactionSummary.usdcBalance.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to send</span>
                  <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(2)}</span>
                </div>
                {amount && Math.abs(parseFloat(amount) - transactionSummary.totalKES) <= 0.9 && (
                  <div className="text-red-500 text-sm">
                    <p className="text-red-500 mt-2 text-sm">
                      Opt-In to Hakiba to gain credit
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction charge (0.5%)</span>
                  <span className="text-orange-600">KE {transactionSummary.transactionCharge.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center font-medium">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">KE {transactionSummary.kesAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={parseFloat(amount) >= 20 ? handleApproveToken : undefined}
                disabled={isApproving || transactionSummary.totalUSDC <= 0}
                type="button"
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isApproving ? "Approving..." : "Confirm payment"}
              </button>

              <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                <div className="text-gray-500 mb-1">
                  Balance after transaction
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Balance</span>
                  <span className="text-gray-600">KE {transactionSummary.totalKESBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USDC Balance</span>
                  <span className="text-gray-600">USDC {transactionSummary.remainingBalance.toFixed(6) }</span>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                We&apos;ll use your available balance when you shop online or
                send money for goods and services. If you don&apos;t have enough
                money in your balance, we&apos;ll ask you to pick another wallet
                at checkout.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendCryptoModal;