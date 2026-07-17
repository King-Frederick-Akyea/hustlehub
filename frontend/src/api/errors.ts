import { AxiosError } from 'axios';

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: ApiFieldError[];
}

export interface ParsedApiError {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export function parseApiError(error: unknown): ParsedApiError {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const body = axiosError?.response?.data;

  const fieldErrors: Record<string, string> = {};
  body?.fieldErrors?.forEach((fe) => {
    fieldErrors[fe.field] = fe.message;
  });

  // Field-level messages (e.g. "Password must contain at least one letter and one number") are far
  // more actionable than the generic top-level "Validation failed" the backend also sends — prefer them.
  const fieldErrorMessages = Object.values(fieldErrors);
  const message =
    fieldErrorMessages.length > 0
      ? fieldErrorMessages.join(' ')
      : body?.message || axiosError?.message || FALLBACK_MESSAGE;

  return {
    message,
    fieldErrors,
    status: axiosError?.response?.status,
  };
}
