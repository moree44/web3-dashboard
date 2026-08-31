"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithRef } from "react";

type LinkProps = ComponentPropsWithRef<typeof Link>;

function hrefToString(href: LinkProps["href"]) {
  return typeof href === "string" ? href : href.href;
}

export function NavLink(props: LinkProps) {
  const router = useRouter();
  const href = hrefToString(props.href);

  return (
    <Link
      {...props}
      prefetch={false}
      onMouseEnter={(event) => {
        if (href) router.prefetch(href);
        props.onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        if (href) router.prefetch(href);
        props.onTouchStart?.(event);
      }}
    />
  );
}
