'use client';

import { useEffect, useState } from 'react';
import InstallPraxidaModal from '@/app/_components/InstallPraxidaModal';

export default function PostLoginInstallTrigger() {
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    // fires once after hydration
    setTrigger(true);
  }, []);

  return <InstallPraxidaModal trigger={trigger} />;
}
