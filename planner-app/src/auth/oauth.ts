const callbackErrorFields = ['error', 'error_code', 'error_description', 'error_uri'] as const;
const failedCallbackFields = [
  ...callbackErrorFields,
  'access_token',
  'refresh_token',
  'provider_token',
  'provider_refresh_token',
  'expires_at',
  'expires_in',
  'token_type',
  'code',
] as const;

export interface OAuthCallbackError {
  message: string;
  cleanedUrl: string;
}

/** Read only known error codes; provider descriptions are never displayed. */
export function parseOAuthCallbackError(href: string): OAuthCallbackError | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }

  const fragment = new URLSearchParams(url.hash.slice(1));
  const hasQueryError = callbackErrorFields.some((field) => url.searchParams.has(field));
  const hasFragmentError = callbackErrorFields.some((field) => fragment.has(field));
  if (!hasQueryError && !hasFragmentError) return undefined;

  const code = fragment.get('error_code') || url.searchParams.get('error_code');
  const error = fragment.get('error') || url.searchParams.get('error');
  let message = 'We could not complete sign-in. Try again or use your email and password.';
  if (code === 'otp_expired') {
    message = 'This sign-in link has expired or was already used. Request a new link and try again.';
  } else if (error === 'access_denied') {
    message = 'Google sign-in was cancelled or declined. Try again or use your email and password.';
  }

  // A failed callback may contain credentials even though the SDK rejected it
  // before clearing its URL. Remove them from both locations on this error path
  // only; successful callbacks remain entirely under the SDK's control.
  failedCallbackFields.forEach((field) => url.searchParams.delete(field));
  if (failedCallbackFields.some((field) => fragment.has(field))) {
    failedCallbackFields.forEach((field) => fragment.delete(field));
    url.hash = fragment.toString();
  }
  return { message, cleanedUrl: url.href };
}
