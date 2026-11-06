import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "픽셀 라이프",
  description: "세계 도시를 여행하며 차근차근 자산을 키우는 픽셀 아트 시뮬레이션 게임",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
