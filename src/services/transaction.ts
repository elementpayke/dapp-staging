import { parseUnits } from "viem"
import { toast } from "react-toastify"

interface CreateOrderParams {
  contract: any
  address: `0x${string}`
  tokenAddress: `0x${string}`
  amount: number
  orderType: number
  messageHash: string
}

interface ApproveTokenParams {
  writeContractAsync: any
  tokenAddress: `0x${string}`
  spenderAddress: `0x${string}`
  amount: number
  decimals?: number
}

/**
 * Approves a token for spending by a contract
 */
export async function approveToken({
  writeContractAsync,
  tokenAddress,
  spenderAddress,
  amount,
  decimals = 6,
}: ApproveTokenParams): Promise<boolean> {
  try {
    await writeContractAsync({
      address: tokenAddress,
      abi: [
        {
          name: "approve",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ],
      functionName: "approve",
      args: [spenderAddress, parseUnits(amount.toString(), decimals)],
    })

    return true
  } catch (error: any) {
    console.error("Approval error:", error)
    toast.error(error?.shortMessage || "Failed to approve token")
    return false
  }
}

/**
 * Creates an order on the contract
 */
export async function createOrder({
  contract,
  address,
  tokenAddress,
  amount,
  orderType,
  messageHash,
}: CreateOrderParams): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    if (!contract) {
      throw new Error("Contract is not initialized.")
    }

    const tx = await contract.createOrder(
      address,
      parseUnits(amount.toString(), 6),
      tokenAddress,
      orderType,
      messageHash,
    )

    console.log("Transaction hash:", tx.hash)
    toast.info("Transaction submitted. Awaiting confirmation...")

    return {
      success: true,
      hash: tx.hash,
    }
  } catch (error: any) {
    console.error("Error creating order:", error)
    toast.error(error?.message || "Transaction failed.")

    return {
      success: false,
      error: error?.message || "Unknown error",
    }
  }
}
