/** Keep in sync with backend utils/password-validation.ts */
export const PASSWORD_MIN_LENGTH = 6;

export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validatePasswordStrength(
  password: string,
): PasswordValidationResult {
  if (typeof password !== "string" || password.length === 0) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  return { valid: true };
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): PasswordValidationResult {
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match" };
  }
  return { valid: true };
}
