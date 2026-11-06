import type { Metadata } from "next";

export const siteUrl = new URL("https://www.pixel-city.life");
export const siteName = "Pixel City Life";
export const siteDescription = "서울에서 첫 월급을 받고 주식과 부동산으로 자산을 키우는 픽셀 아트 도시 생활 시뮬레이션 게임입니다.";
export const homeBreadcrumb = { name: "도시 선택", path: "/" };

export const shareImage = {
  url: "/my-city/seoul-street.png",
  width: 2172,
  height: 724,
  alt: "남산서울타워가 보이는 서울 골목을 걷는 Pixel City Life의 픽셀 캐릭터",
};

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName,
      url: path,
      title,
      description,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).href;
}
