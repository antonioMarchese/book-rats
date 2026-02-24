import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "./LandingPage";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
