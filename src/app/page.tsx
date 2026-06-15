import { getBirds } from "@/lib/data/birds";
import { HomeClient } from "@/components/home/home-client";

export default async function HomePage() {
  const birds = await getBirds();
  return <HomeClient birds={birds} />;
}
