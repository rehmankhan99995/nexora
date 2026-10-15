"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error?: string; success?: string };

const passwordMessage = "Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.";

function getField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string) {
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

async function getOrigin() {
  const requestHeaders = await headers();
  return requestHeaders.get("origin") ?? "http://localhost:3000";
}

export async function signInAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = getField(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!isValidEmail(email) || !password) return { error: "Enter a valid work email and password." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "We could not sign you in with those details." };
  redirect("/dashboard");
}

export async function signUpAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const fullName = getField(formData, "fullName");
  const email = getField(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const acceptedTerms = formData.get("terms") === "on";
  if (!fullName || fullName.length > 120) return { error: "Enter your full name." };
  if (!isValidEmail(email)) return { error: "Enter a valid work email." };
  if (!acceptedTerms) return { error: "Accept the Terms of Service and Privacy Policy to continue." };
  if (!isValidPassword(password)) return { error: passwordMessage };
  if (password !== confirmPassword) return { error: "Passwords do not match." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${await getOrigin()}/auth/callback?next=/dashboard` },
  });
  if (error) return { error: "We could not create your account with those details." };
  if (data.session) redirect("/dashboard");
  redirect("/auth/sign-up-success");
}

export async function forgotPasswordAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = getField(formData, "email").toLowerCase();
  if (!isValidEmail(email)) return { error: "Enter a valid work email." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await getOrigin()}/auth/callback?next=/reset-password` });
  return { success: "If an account matches that email, reset instructions are on their way." };
}

export async function updatePasswordAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!isValidPassword(password)) return { error: passwordMessage };
  if (password !== confirmPassword) return { error: "Passwords do not match." };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "This reset link is no longer valid. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "We could not update your password. Please try again." };
  redirect("/dashboard");
}