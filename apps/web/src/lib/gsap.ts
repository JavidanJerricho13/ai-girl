'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

let registered = false;

export async function registerScrollTrigger() {
  if (registered) return;
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

export { gsap, useGSAP };
