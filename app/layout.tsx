import type { Metadata } from "next";
import "./globals.css";

import { Pretendard } from "./styles/fonts";

export const metadata: Metadata = {
  title: "디키캠프 FAQ",
  description: "디키캠프 고객 문의 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={Pretendard.className}>
        {children}
      </body>
    </html>
  );
}