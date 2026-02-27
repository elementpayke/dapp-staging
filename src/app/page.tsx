import Header from "@/components/landingPage/Header";
import LandingPage from "@/components/LandingPage";
import HomeRedirectGuard from "@/components/auth/HomeRedirectGuard";

export default function Home() {
  return (
    <main>
      <HomeRedirectGuard />
      <Header />
      <LandingPage />
    </main>
  );
}
