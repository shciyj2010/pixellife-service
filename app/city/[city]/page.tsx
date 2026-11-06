import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cities } from "../../cities";
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
  const description = hasScenes
    ? `${name}의 거리와 사무실을 둘러보고 보유 코인과 다음 집 목표를 확인하세요.`
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
      <MyCity key={city} {...details} />
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
