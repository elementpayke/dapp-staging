import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./useWallet";

export const useAuth = () => {
  const { isConnected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  return isConnected;
};
