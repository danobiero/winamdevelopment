'use client';

import { useEffect, useState } from 'react';
import InstallWINAMModal from '@/app/_components/InstallWINAMModal';

export default function PostLoginInstallTrigger() {
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    // fires once after hydration
    setTrigger(true);
  }, []);

  return <InstallWINAMModal trigger={trigger} />;
}
