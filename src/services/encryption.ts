import Fernet from 'fernet';

// Ensure you set the secret key in your environment variables with a NEXT_PUBLIC prefix.
// Use the hard-coded value for now.
// TODI: Replace this with a dynamic secret key from the env.
const SECRET_KEY = "Nt-H5Ofmhk1JonVFjrRJr_pV6p-oADX_FdrQyFAqx5Y=";

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY_DECRYPT is not defined');
}

// Create a Fernet secret instance.
const secret = new Fernet.Secret(SECRET_KEY);

/**
 * Encrypts the message using Fernet.
 * @param cashout_type The type of cashout.
 * @param amount_fiat The amount in fiat.
 * @param currency The currency of the amount.
 * @param rate The exchange rate.
 * @param phone_number The phone number.
 * @param paybill_number The paybill number.
 * @param account_number The account number.
 * @param till_number The till number.
 * @returns The encrypted message as a string.
 */

export const encryptMessage = (
  cashout_type: string,
  amount_fiat: number,
  currency: string,
  rate: number,
  phone_number: string,
  paybill_number: string,
  account_number: string,
  till_number: string,
): string => {
  const message = `${cashout_type},${amount_fiat},${currency},${rate},${phone_number},${paybill_number},${account_number},${till_number}`;
  // Create a Fernet token with the secret and current time.
  const token = new Fernet.Token({
    secret: secret,
    time: Math.floor(Date.now() / 1000),
  });

  // Encode the message to create the encrypted token.
  return token.encode(message);
};

/**
 * Decrypts a message encrypted with Fernet.
 * @param encryptedMessage The encrypted message.
 * @returns The decrypted message as a string.
 */
export const decryptMessage = (encryptedMessage: string): string => {
  const token = new Fernet.Token({
    secret: secret,
    token: encryptedMessage,
    ttl: 0,
  });

  // Decode the encrypted token to retrieve the original message.
  return token.decode();
};
