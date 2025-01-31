import Fernet from 'fernet';

// Ensure you set the secret key in your environment variables with a NEXT_PUBLIC prefix.
// Use the hard-coded value for now.
// TODI: Replace this with a dynamic secret key from the env.
const SECRET_KEY = "Nt-H5Ofmhk1JonVFjrRJr_pV6p-oADX_FdrQyFAqx5Y="
// process.env.SECRET_KEY_DECRYPT;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY_DECRYPT is not defined');
}

// Create a Fernet secret instance.
const secret = new Fernet.Secret(SECRET_KEY);

/**
 * Encrypts the message using Fernet.
 * @param phoneNumber The phone number.
 * @param currency The currency.
 * @param rate The exchange rate.
 * @param totalAmount The total amount.
 * @returns The encrypted message.
 */
export const encryptMessage = (
  phoneNumber: string,
  currency: string,
  rate: number,
  totalAmount: number
): string => {
  const message = `${phoneNumber}:${currency}:${rate}:${totalAmount}`;

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
