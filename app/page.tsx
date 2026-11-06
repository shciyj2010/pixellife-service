import CityPicker from "./city-picker";
import JsonLd from "./json-ld";
import { absoluteUrl, pageMetadata, shareImage, siteDescription, siteName } from "./seo";

export const metadata = pageMetadata("/", siteName, siteDescription);

export default function Home() {
  const homeUrl = absoluteUrl("/");

  return (
    <>
      <CityPicker />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": homeUrl + "#website",
            name: siteName,
            url: homeUrl,
            inLanguage: "ko",
            about: { "@id": homeUrl + "#game" },
          },
          {
            "@type": "VideoGame",
            "@id": homeUrl + "#game",
            name: siteName,
            url: homeUrl,
            description: siteDescription,
            image: absoluteUrl(shareImage.url),
            genre: "Simulation",
            gamePlatform: "Web browser",
            inLanguage: "ko",
          },
        ],
      }} />
    </>
  );
}
