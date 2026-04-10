"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AuraHeader = dynamic(() => import("@/components/Header"), { ssr: false });

export default function AuraHeaderWrapper() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return <AuraHeader />;
}
