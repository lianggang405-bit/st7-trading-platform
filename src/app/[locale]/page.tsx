'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();

  useEffect(() => {
    params.then(({ locale }) => {
      router.replace(`/${locale}/market`);
    });
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );
}
