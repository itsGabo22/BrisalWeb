import { HeroSlidesSection } from '@/components/admin/HeroSlidesSection';
import { BannerSection } from '@/components/admin/BannerSection';
import { ParallaxImagesSection } from '@/components/admin/ParallaxImagesSection';
import { PromoPopupSection } from '@/components/admin/PromoPopupSection';

export default function AdminConfiguracionPage() {
  return (
    <div className="space-y-6">
      <HeroSlidesSection />
      <BannerSection />
      <ParallaxImagesSection />
      <PromoPopupSection />
    </div>
  );
}
