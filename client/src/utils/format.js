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

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

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
 * Convert an ISO timestamp into a local "YYYY-MM-DDTHH:mm" string for datetime-local inputs.
 */
export const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const offsetMinutes = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offsetMinutes * 60_000);
  return localDate.toISOString().slice(0, 16);
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
 * Validate basic email address formatting matching backend schema expectations.
 */
export const isValidEmail = (value) =>
  typeof value === "string" && EMAIL_REGEX.test(value.trim());

/**
 * Validate optional http/https URLs for event banner images.
 */
export const isValidHttpUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Extract a user-friendly error message from an Axios error object.
 */
export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === "ECONNABORTED") {
    return "The request timed out. The server may be waking up—please try again.";
  }

  if (error?.request && !error?.response) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }

  const status = error?.response?.status;
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return "The requested resource could not be found.";
  }
  if (status >= 500) {
    return "A server error occurred. Please try again in a moment.";
  }

  return error?.message || fallback;
};
