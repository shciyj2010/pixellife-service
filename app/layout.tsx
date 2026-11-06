import type { Metadata } from "next";
import { siteUrl } from "./seo";

export const metadata: Metadata = {
  metadataBase: siteUrl,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
