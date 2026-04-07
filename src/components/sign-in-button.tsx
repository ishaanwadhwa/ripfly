"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  return (
    <Button
      size={variant === "outline" ? "sm" : "lg"}
      variant={variant}
      className={variant === "outline" ? "" : "w-full max-w-xs transition-all duration-200 hover:scale-105 hover:shadow-lg"}
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
    >
      Sign in with Google
    </Button>
  );
}
