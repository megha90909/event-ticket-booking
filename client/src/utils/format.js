const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrDecimalFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format an ISO date string or timestamp into a readable date.
 */
export const formatDate = (value) => {
  if (!value) return "TBD";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "TBD" : dateFormatter.format(parsed);
};

/**
 * Format an ISO date string or timestamp into a readable date and time.
 */
export const formatDateTime = (value) => {
  if (!value) return "TBD";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "TBD"
    : dateTimeFormatter.format(parsed);
};

/**
 * Format ticket prices in Indian Rupees (INR), returning "Free" for 0.
 */
export const formatPrice = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return "—";
  }
  if (numericAmount === 0) {
    return "Free";
  }
  return Number.isInteger(numericAmount)
    ? inrWholeFormatter.format(numericAmount)
    : inrDecimalFormatter.format(numericAmount);
};

/**
 * Extract a user-friendly error message from an Axios error object.
 */
export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.request && !error?.response) {
    return "Cannot connect to the server. Please verify the API server is running.";
  }
  return error?.message || fallback;
};

