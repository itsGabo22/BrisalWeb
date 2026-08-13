import { HeroSlidesSection } from '@/components/admin/HeroSlidesSection';
import { BannerSection } from '@/components/admin/BannerSection';
import { SectionVideosSection } from '@/components/admin/SectionVideosSection';
import { WholesaleBackgroundSection } from '@/components/admin/WholesaleBackgroundSection';
import { PromoPopupSection } from '@/components/admin/PromoPopupSection';

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
      <PromoPopupSection />
    </div>
  );
}
