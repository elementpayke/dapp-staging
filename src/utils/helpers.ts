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

export const formatToLocal = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    // Use browser's local time zone
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short"
    });
  } catch {
    return dateString;
  }
};
