import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "졸업요건 플래너",
    description: "의공학전공과 의료AI반도체융합전공 졸업요건을 계산하고 관리합니다.",
    openGraph: {
      title: "졸업요건 플래너",
      description: "이수 · 예정 · 중복인정을 자동으로 계산합니다.",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: "졸업요건 플래너" }],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
