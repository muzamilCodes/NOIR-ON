'use client';

import { useEffect, useRef } from 'react';
import type { WatchOptions } from '@/lib/watch3d';

interface Props extends WatchOptions {
  variant?: 'hero' | 'card';
  className?: string;
}

export default function Watch3D({ variant = 'card', className, ...opts }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let dispose = () => {};
    let cancelled = false;
    (async () => {
      const mod = await import('@/lib/watch3d');
      if (cancelled || !ref.current) return;
      dispose = variant === 'hero' ? mod.initHeroWatch(ref.current, opts) : mod.initCardWatch(ref.current, opts);
    })();
    return () => {
      cancelled = true;
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, opts.caseColor, opts.strapColor, opts.brandText, opts.spinSpeed]);

  return <canvas ref={ref} className={className} />;
}
