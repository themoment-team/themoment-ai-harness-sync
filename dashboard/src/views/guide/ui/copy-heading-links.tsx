'use client';

import { useEffect } from 'react';

export function CopyHeadingLinks() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const anchor = (event.target as Element).closest('a.anchor-heading');
      if (!anchor || !navigator.clipboard) return;

      event.preventDefault();
      void navigator.clipboard.writeText((anchor as HTMLAnchorElement).href);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
