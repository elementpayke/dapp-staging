"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useContractEvents } from "@/context/useContractEvents";
import { useContract } from "@/services/useContract";
import { ConnectWallet } from "@coinbase/onchainkit/wallet";
import { getUSDCAddress } from "@/services/tokens";
import { encryptMessage } from "@/services/encryption";
import { parseUnits } from "ethers";

export default function Page() {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const { isConnected, disconnectWallet, usdcBalance } = useWallet();
  const { contract, address } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const MARKUP_PERCENTAGE = 1.5;

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDC");
      const data = await response.json();

      if (data?.data?.rates?.KES) {
        const baseRate = parseFloat(data.data.rates.KES);
        const markupRate = baseRate * (1 - MARKUP_PERCENTAGE / 100);
        setExchangeRate(markupRate);
        setErrorMessage(null);
      } else {
        throw new Error("Invalid exchange rate data.");
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setExchangeRate(null);
      setErrorMessage("Failed to fetch exchange rate. Please try again.");
    }
  };

  useContractEvents(
    (order: any) => console.log("OrderCreated", order),
    (order: any) => console.log("OrderSettled", order),
    () => console.log("OrderRefunded")
  );

  const handleSendCrypto = async () => { 
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount.");
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }
    if (!exchangeRate) {
      setErrorMessage("Exchange rate unavailable. Try again later.");
      return;
    }
    if (!address || address === "0x0") {
      setErrorMessage("Invalid wallet address. Please reconnect your wallet.");
      return;
    }
    if (!usdcBalance || isNaN(Number(usdcBalance))) {
      setErrorMessage("USDC balance is unavailable.");
      return;
    }

    setErrorMessage(null);
    const usdcTokenAddress = getUSDCAddress() as `0x${string}`;
    const mpesaAmount = parseFloat(amount) * exchangeRate;
    const orderType = 0; // Hardcoded to MPESA (type 0)

    let parsedAmount;
    try {
      parsedAmount = parseUnits(amount, 6);
    } catch {
      setErrorMessage("Invalid amount format.");
      return;
    }

    setIsLoading(true);
    try {
      const messageHash = encryptMessage(phoneNumber, "USDC", exchangeRate, mpesaAmount);
      if (!contract) throw new Error("Contract not found");
      
      const tx = await contract.createOrder(
        address,
        parsedAmount, 
        usdcTokenAddress,
        orderType,
        messageHash
      );
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
    } catch (error) {
      setErrorMessage("Transaction failed.");
      console.error("Transaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg my-auto">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#444]">Send Crypto</h1>

      {errorMessage && (
        <p className="text-red-500 text-sm text-center mb-4">{errorMessage}</p>
      )}

      {isConnected ? (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (KES)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-[#444]"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-[#444]"
              placeholder="2547XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <p className="text-sm text-gray-500">
            Exchange Rate: {exchangeRate ? `1 USDC = ${exchangeRate.toFixed(2)} KES` : "Loading..."}
          </p>

          <button
            onClick={handleSendCrypto}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Crypto"}
          </button>

          <div className="px-5 border mt-6 pt-6 h-[100px]">    
            <p className="text-sm text-gray-500">
              USDC Balance: {usdcBalance}
            </p>
          </div>

          <button
            onClick={disconnectWallet}
            className="w-full mt-4 bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="text-center flex flex-col justify-center items-center">
          <p className="text-gray-600 text-lg">Checking wallet connection...</p>
          <ConnectWallet text="Connect Wallet" />
        </div>
      )}
    </div>
  );
}