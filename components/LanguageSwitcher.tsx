"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();

  const pathWithoutLocale = pathname.replace(/^\/(en|my)/, "");

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <Link href={`/en${pathWithoutLocale}`}>English</Link>
      <Link href={`/my${pathWithoutLocale}`}>မြန်မာ</Link>
    </div>
  );
}
