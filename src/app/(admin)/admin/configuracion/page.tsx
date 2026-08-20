import { HeroSlidesSection } from '@/components/admin/HeroSlidesSection';
import { BannerSection } from '@/components/admin/BannerSection';
import { SectionVideosSection } from '@/components/admin/SectionVideosSection';
import { WholesaleBackgroundSection } from '@/components/admin/WholesaleBackgroundSection';
import { WholesaleExtrasSection } from '@/components/admin/WholesaleExtrasSection';
import { PromoPopupSection } from '@/components/admin/PromoPopupSection';
import { LegalSection } from '@/components/admin/LegalSection';

export default function AdminConfiguracionPage() {
  return (
    <div className="space-y-6">
      <HeroSlidesSection />
      <BannerSection />
      <SectionVideosSection />
      {/*
        Replaces «Imágenes de fondo» entirely, and takes the wholesale slot out
        of «Videos de sección». The wholesale band's background was previously
        configured from two separate panels with no indication of which asset
        the site actually rendered; it is one control now.
      */}
      <WholesaleBackgroundSection />
      {/* Welcome message + /mayoristas explainer video — both wholesale-program
          controls, grouped right after the homepage wholesale band so the two
          videos sit near each other but stay clearly distinct in their labels. */}
      <WholesaleExtrasSection />
      <PromoPopupSection />
      {/* Last: it is the panel the client will touch least often, and it is the
          tallest, so putting it above the media panels would bury them. */}
      <LegalSection />
    </div>
  );
}
