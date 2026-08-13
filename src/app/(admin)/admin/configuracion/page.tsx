import { HeroSlidesSection } from '@/components/admin/HeroSlidesSection';
import { BannerSection } from '@/components/admin/BannerSection';
import { ParallaxImagesSection } from '@/components/admin/ParallaxImagesSection';
import { SectionVideosSection } from '@/components/admin/SectionVideosSection';
import { PromoPopupSection } from '@/components/admin/PromoPopupSection';

export default function AdminConfiguracionPage() {
  return (
    <div className="space-y-6">
      <HeroSlidesSection />
      <BannerSection />
      <SectionVideosSection />
      <ParallaxImagesSection />
      <PromoPopupSection />
    </div>
  );
}
