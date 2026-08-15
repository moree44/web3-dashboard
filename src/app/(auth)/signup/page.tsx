import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Signup closed · Web3 Hunting OS" };

export default function SignupPage() {
  redirect("/login");
}
