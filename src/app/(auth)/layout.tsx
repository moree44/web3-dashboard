import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-0">
        <Image
          src="/bg_login.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative z-10">{children}</div>
    </>
  );
}
