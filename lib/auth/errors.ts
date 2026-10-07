export const authErrorMessages: Record<string, string> = {
  Configuration: "Sign-in is not set up correctly. Try again later.",
  AccessDenied: "Access denied. Sign-in could not be completed.",
  Verification:
    "The sign-in link is not valid or has expired. Request a new one from this page.",
  OAuthSignin: "Could not start sign-in with the provider. Try again.",
  OAuthCallback: "Something went wrong coming back from the provider. Try again.",
  OAuthCreateAccount: "Could not create the account with that provider.",
  EmailCreateAccount: "Could not create the account with that email.",
  Callback: "Something went wrong during sign-in. Try again.",
  OAuthAccountNotLinked:
    "That email is already linked to another sign-in method. Use the one you used before.",
  EmailSignin: "Could not send the link to that email. Check the address and try again.",
  CredentialsSignin: "Could not sign in. Check your details and try again.",
  SessionRequired: "Sign in to continue.",
  Default: "Could not sign in. Try again.",
};

export function getAuthErrorMessage(code?: string | string[] | null): string | null {
  if (!code) return null;
  const key = Array.isArray(code) ? code[0] : code;
  return authErrorMessages[key] ?? authErrorMessages.Default;
}
