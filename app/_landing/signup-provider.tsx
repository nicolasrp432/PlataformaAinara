"use client";

import { createContext, useContext, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

// Auth, Supabase and the registration sheet load only when registration is opened.
const RegisterModal = dynamic(
  () => import("./register-modal").then((module) => module.RegisterModal),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="fixed bottom-5 right-5 z-50 rounded-xl border bg-card p-4 shadow-lg"
      >
        Abriendo tu registro…
      </div>
    ),
  },
);
const SignupContext = createContext<() => void>(() => {});

export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  function show() {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpen(true);
  }
  return (
    <SignupContext.Provider value={show}>
      {children}
      {open && (
        <RegisterModal
          open={open}
          onClose={() => setOpen(false)}
          returnFocusRef={triggerRef}
        />
      )}
    </SignupContext.Provider>
  );
}

export function SignupButton({
  children,
  className,
  variant = "default",
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  size?: "sm" | "lg";
}) {
  const show = useContext(SignupContext);
  return (
    <Button size={size} variant={variant} className={className} onClick={show}>
      {children}
    </Button>
  );
}
