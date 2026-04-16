'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { fluidFragmentShader, fluidVertexShader } from './shaders/fluid';

function useVisibility<T extends HTMLElement>(ref: React.RefObject<T>) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}

function FluidPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const mouseTarget = useRef(new THREE.Vector2(0.5, 0.5));

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      mouseTarget.current.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uIntensity: { value: 1 },
    }),
    // only set once — uResolution updated below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms.uResolution.value]);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    uniforms.uTime.value += delta;
    // smooth cursor for parallax-like feel
    uniforms.uMouse.value.lerp(mouseTarget.current, 0.05);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={fluidVertexShader}
        fragmentShader={fluidFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function FluidBackground() {
  const hostRef = useRef<HTMLDivElement>(null);
  const visible = useVisibility(hostRef);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (reduced) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-nocturne via-plum to-nocturne"
      />
    );
  }

  return (
    <div ref={hostRef} aria-hidden className="absolute inset-0 h-full w-full">
      <Canvas
        className="absolute inset-0 h-full w-full"
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        frameloop={visible ? 'always' : 'never'}
      >
        <FluidPlane />
      </Canvas>
    </div>
  );
}
