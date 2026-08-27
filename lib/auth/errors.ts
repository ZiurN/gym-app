export const authErrorMessages: Record<string, string> = {
  Configuration: "Hay un problema de configuración del inicio de sesión. Inténtalo más tarde.",
  AccessDenied: "Acceso denegado. No se pudo completar el inicio de sesión.",
  Verification:
    "El enlace de acceso no es válido o ya expiró. Solicita uno nuevo desde esta página.",
  OAuthSignin: "No se pudo iniciar el flujo con el proveedor. Inténtalo de nuevo.",
  OAuthCallback: "Error al volver del proveedor de acceso. Inténtalo de nuevo.",
  OAuthCreateAccount: "No se pudo crear la cuenta con ese proveedor.",
  EmailCreateAccount: "No se pudo crear la cuenta con ese correo.",
  Callback: "Error en el proceso de inicio de sesión. Inténtalo de nuevo.",
  OAuthAccountNotLinked:
    "Ese correo ya está asociado a otra forma de acceso. Entra con el método que usaste antes.",
  EmailSignin: "No se pudo enviar el enlace al correo. Revisa la dirección e inténtalo de nuevo.",
  CredentialsSignin: "No se pudo iniciar sesión. Revisa los datos e inténtalo de nuevo.",
  SessionRequired: "Debes iniciar sesión para continuar.",
  Default: "No se pudo iniciar sesión. Inténtalo de nuevo.",
};

export function getAuthErrorMessage(code?: string | string[] | null): string | null {
  if (!code) return null;
  const key = Array.isArray(code) ? code[0] : code;
  return authErrorMessages[key] ?? authErrorMessages.Default;
}
