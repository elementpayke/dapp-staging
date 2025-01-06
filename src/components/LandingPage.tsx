import FAQSection from "./landingPage/FAQSection";
import FeaturesSection from "./landingPage/Features";
import HeroSection from "./landingPage/HeroSection";
import TokensSection from "./landingPage/TokensSection";
import WhyWeRock from "./landingPage/WhyWeRock";

const LandingPage = () => {
  return (
    <div>
      <HeroSection />
      <WhyWeRock />
      <FeaturesSection />
      <FAQSection />
      <TokensSection />
    </div>
  );
};

export default LandingPage;
