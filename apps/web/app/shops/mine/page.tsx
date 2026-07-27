'use client';

import { MyShopsStudio } from '@/components/shops/MyShopsStudio';
import '../shops.css';
import '../../marketplace/create/publish.css';

export default function MyShopsPage() {
  return (
    <div className="shp-page shp-page--mine">
      <MyShopsStudio />
    </div>
  );
}
