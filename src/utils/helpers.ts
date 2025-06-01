export const formatReceiverName = (name: string | null): string => {
  if (!name) return "N/A";

  const phoneNamePattern = /^(\d+)\s*-\s*(.+)$/;
  const match = name.match(phoneNamePattern);

  if (match) {
    return match[2].trim();
  }

  return name.trim();
};

export const formatErrorMessage = (error: string) => {
  if (error.toLowerCase().includes("The operator does not exist")) {
    return "Phone number does not exist. Please enter a valid phone number.";
  }
  return error;
};
