import Header from "@/components/landingPage/Header";
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/auth/AuthModal";
import HomeRedirectGuard from "@/components/auth/HomeRedirectGuard";
import PrivyWalletListener from "@/components/auth/PrivyWalletListener";

export default function Home() {
  return (
    <main>
      <HomeRedirectGuard />
      <Header />
      <LandingPage />
      <AuthModal />
      <PrivyWalletListener />
    </main>
  );
}
