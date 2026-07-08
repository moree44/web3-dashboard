export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
export const INTERNAL_EMAIL_DOMAIN = "web3-hunting.local";

export function normalizeUsername(value: string) {
  return value.trim();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function toInternalEmail(value: string) {
  const username = normalizeUsername(value);

  if (!isValidUsername(username)) {
    throw new Error("Invalid username");
  }

  return username + "@" + INTERNAL_EMAIL_DOMAIN;
}
