import { z } from "zod";

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

const username = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(24, "Username must be at most 24 characters")
  .regex(USERNAME_PATTERN, "Use lowercase letters, numbers, and underscores only");

const password = z.string().min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  username,
  password,
});

export const signupSchema = z
  .object({
    username,
    displayName: z.string().trim().min(1, "Display name is required").max(64),
    password,
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
