import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SBF Workbench | Business Framework 관리",
  description: "SBF 마스터, 변경요청, IA–L3 매핑과 데이터 품질을 통합 관리합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
