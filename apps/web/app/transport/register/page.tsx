'use client';

import { DriverRegisterStudio } from '@/components/transport/DriverRegisterStudio';
import '../../marketplace/create/publish.css';
import './driver-register.css';

export default function DriverRegisterPage() {
  return (
    <div className="pub-page">
      <DriverRegisterStudio />
    </div>
  );
}
