export const cities = {
  seoul: { name: "서울", title: "SEOUL", hasScenes: true },
  tokyo: { name: "도쿄", title: "TOKYO", hasScenes: false },
  "new-york": { name: "뉴욕", title: "NEW YORK", hasScenes: false },
};

export type CityId = keyof typeof cities;
