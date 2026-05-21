import { redirect } from "next/navigation";

export default async function DirectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/library?dir=${slug}`);
}
