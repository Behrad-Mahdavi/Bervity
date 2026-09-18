'use client';

import React, { useEffect, useState } from 'react';
import { Provider, defaultTheme } from '@adobe/react-spectrum';

export function SpectrumClientProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Provider
      theme={defaultTheme}
      colorScheme="dark"
      locale="fa-IR"
      UNSAFE_className="spectrum-provider-root"
    >
      <div dir="rtl" className="w-full min-h-screen text-[#EDEAE3] bg-[#12151C] font-dana">
        {children}
      </div>
    </Provider>
  );
}
