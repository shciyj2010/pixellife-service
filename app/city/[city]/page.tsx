import { notFound } from "next/navigation";
import MyCity from "./my-city";

const cities = {
  seoul: { name: "서울", title: "SEOUL" },
  tokyo: { name: "도쿄", title: "TOKYO" },
  "new-york": { name: "뉴욕", title: "NEW YORK" },
};

export function generateStaticParams() {
  return Object.keys(cities).map((city) => ({ city }));
}

export default async function CityPage({ params }: PageProps<"/city/[city]">) {
  const { city } = await params;
  if (!Object.hasOwn(cities, city)) notFound();

  return <MyCity key={city} city={city} {...cities[city as keyof typeof cities]} />;
}
