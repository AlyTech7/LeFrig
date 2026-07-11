'use client';

import { ShopManageStudio } from '@/components/shops/ShopManageStudio';
import '../../shops.css';
import '../../../marketplace/create/publish.css';

export default function ShopManagePage() {
  return (
    <div className="shp-page shp-page--manage">
      <ShopManageStudio />
    </div>
  );
}
