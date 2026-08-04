import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div
        className="fixed inset-0"
        style={{
          backgroundImage: "url('/bg_login.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative z-10">{children}</div>
    </>
  );
}
