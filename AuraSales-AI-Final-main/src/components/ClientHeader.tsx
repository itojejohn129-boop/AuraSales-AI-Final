"use client";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";

export default function ClientHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <Header />;
}