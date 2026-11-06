import type { Metadata } from "next";

export const siteUrl = new URL("https://www.pixel-city.life");
export const siteName = "픽셀 씨티 라이프";
export const siteDescription = "집값 고공행진에 박탈감을 느끼며 만든, 그냥 돈이 생기는 세상 '픽셀 씨티'야!";
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
