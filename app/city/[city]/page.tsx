import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cities, type CityId } from "../../cities";
import JsonLd from "../../json-ld";
import { absoluteUrl, homeBreadcrumb, pageMetadata, siteName } from "../../seo";
import MyCity from "./my-city";

export function generateStaticParams() {
  return Object.keys(cities).map((city) => ({ city }));
}

function getCity(slug: string) {
  if (!Object.hasOwn(cities, slug)) notFound();
  return cities[slug as keyof typeof cities];
}

export async function generateMetadata({ params }: PageProps<"/city/[city]">): Promise<Metadata> {
  const { city } = await params;
  const { name, hasScenes } = getCity(city);
  const description = city === "seoul"
    ? "픽셀 서울에 온 걸 환영해! 출근하고, 카페에서 알바하고, 편의점도 들러 봐. 통장에 셀이 차곡차곡 쌓이면 다음 집으로 점프! 🏠"
    : `${name}의 도시 장면은 준비 중입니다.`;

  return {
    ...pageMetadata(`/city/${city}`, `${name} 나의 도시 | ${siteName}`, description),
    ...(hasScenes ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CityPage({ params }: PageProps<"/city/[city]">) {
  const { city } = await params;
  const details = getCity(city);
  const cityUrl = absoluteUrl(`/city/${city}`);

  return (
    <>
      <MyCity key={city} city={city as CityId} {...details} />
      {details.hasScenes && <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeBreadcrumb.name, item: absoluteUrl(homeBreadcrumb.path) },
          { "@type": "ListItem", position: 2, name: details.name, item: cityUrl },
        ],
      }} />}
    </>
  );
}
