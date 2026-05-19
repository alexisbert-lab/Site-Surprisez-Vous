'use client';
import dynamic from 'next/dynamic';

const BalloonBackground = dynamic(() => import('./BalloonBackground'), { ssr: false });

export default function BalloonBackgroundLazy() {
  return <BalloonBackground />;
}
