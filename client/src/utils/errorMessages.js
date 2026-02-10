function normalize(value) {
  return (value || '').toString().toLowerCase();
}

export function getAuthErrorMessage(error, fallback = 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.') {
  const code = normalize(error?.code);
  const message = normalize(error?.message);
  const status = Number(error?.status || 0);

  if (status >= 500) {
    return 'Der Dienst ist momentan nicht erreichbar. Bitte versuche es später erneut.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Verbindungsproblem. Bitte prüfe deine Internetverbindung und versuche es erneut.';
  }

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-Mail oder Passwort ist nicht korrekt.';
  }

  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Zu dieser E-Mail existiert bereits ein Konto.';
  }

  if (message.includes('password')) {
    return 'Das Passwort muss mindestens 8 Zeichen lang sein und mindestens 1 Großbuchstaben, 1 Zahl und 1 Sonderzeichen enthalten.';
  }

  if (message.includes('anonymous sign-ins are disabled') || code === 'anonymous_provider_disabled') {
    return 'Registrierung ist aktuell nicht verfügbar. Bitte versuche es später erneut.';
  }

  if (message.includes('email address') || message.includes('invalid email')) {
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  }

  if (message.includes('email not confirmed')) {
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  }

  return fallback;
}
