// TODO: Have address serving dynamically
export const getUSDCAddress = (): `0x${string}` => {
  //get it from the env
   const address = process.env.NEXT_PUBLIC_USDC_ADDRESS;
   if (!address) {
     throw new Error("USDC address is not defined in the environment variables");
   }
   if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
     throw new Error("USDC address is not a valid Ethereum address");
   }
   return address as `0x${string}`;
 };
 