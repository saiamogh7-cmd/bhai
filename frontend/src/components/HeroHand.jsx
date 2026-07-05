import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Build a particle cloud that forms a hand shape ──────────────────────────
// We generate points that lie inside a hand-shaped volume by:
// 1. Defining the hand as a union of capsule volumes (palm + 5 fingers)
// 2. Rejection-sampling random points until we fill the hand
function inCapsule(px, py, pz, ax, ay, az, bx, by, bz, r) {
  const abx = bx - ax, aby = by - ay, abz = bz - az;
  const apx = px - ax, apy = py - ay, apz = pz - az;
  const len2 = abx * abx + aby * aby + abz * abz;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / len2));
  const dx = px - (ax + t * abx);
  const dy = py - (ay + t * aby);
  const dz = pz - (az + t * abz);
  return dx * dx + dy * dy + dz * dz < r * r;
}

// Capsule segments for a right hand (in local space, palm up)
// Format: [ax,ay,az,  bx,by,bz,  radius]
const CAPS = [
  // Palm (wide short box approximated by overlapping capsules)
  [-0.35, -0.6, 0,   0.35, -0.6, 0,   0.38],  // palm base
  [-0.30, -0.2, 0,   0.30, -0.2, 0,   0.36],  // palm mid
  [-0.28,  0.1, 0,   0.28,  0.1, 0,   0.32],  // palm top

  // Thumb (angled left)
  [-0.35, -0.4, 0.05,  -0.60, -0.0, 0.1,  0.15],
  [-0.60, -0.0, 0.1,   -0.78,  0.3, 0.08, 0.13],
  [-0.78,  0.3, 0.08,  -0.88,  0.55, 0.06, 0.10],

  // Index finger
  [-0.30,  0.1, 0,   -0.32,  0.6, 0,   0.12],
  [-0.32,  0.6, 0,   -0.32,  1.1, 0,   0.11],
  [-0.32,  1.1, 0,   -0.30,  1.5, 0,   0.09],

  // Middle finger (tallest)
  [-0.06,  0.1, 0,   -0.06,  0.65, 0,  0.12],
  [-0.06,  0.65, 0,  [-0.06,  1.2, 0], 0.11],  // dummy — fix below
  [-0.06,  1.2, 0,   -0.04,  1.65, 0,  0.09],

  // Ring finger
  [ 0.20,  0.1, 0,   0.22,  0.6, 0,   0.11],
  [ 0.22,  0.6, 0,   0.22,  1.1, 0,   0.10],
  [ 0.22,  1.1, 0,   0.20,  1.45, 0,  0.09],

  // Pinky (shorter)
  [ 0.44,  0.0, 0,   0.47,  0.45, 0,  0.10],
  [ 0.47,  0.45, 0,  0.47,  0.80, 0,  0.09],
  [ 0.47,  0.80, 0,  0.45,  1.05, 0,  0.08],
];

// Fix the broken entry above
CAPS[10] = [-0.06, 0.65, 0, -0.06, 1.2, 0, 0.11];

function inHand(px, py, pz) {
  for (const c of CAPS) {
    if (inCapsule(px, py, pz, c[0], c[1], c[2], c[3], c[4], c[5], c[6])) return true;
  }
  return false;
}

function buildHandPoints(count) {
  const pts = [];
  const BX = 1.1, BY = 1.85, BZ = 0.3;
  while (pts.length < count * 3) {
    const x = (Math.random() * 2 - 1) * BX;
    const y = (Math.random() * 2 - 1) * BY * 0.5 + 0.4; // bias upward
    const z = (Math.random() * 2 - 1) * BZ;
    if (inHand(x, y, z)) {
      pts.push(x, y, z);
    }
  }
  return new Float32Array(pts);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HeroHand() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = el.clientWidth || 380;
    const H = el.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0.4, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.scale.setScalar(1.55);
    scene.add(group);

    // ── 1. Main particle cloud (the hand shape) ──
    const N = 4500;
    const positions = buildHandPoints(N);

    // Assign per-particle brightness based on Y (top = brighter like a light from above)
    const colors = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = positions[i * 3 + 1];
      // spotlight: brighter near top-centre
      const x = positions[i * 3];
      const dist = Math.sqrt(x * x + (y - 1.5) * (y - 1.5));
      const bright = Math.max(0.2, 1.0 - dist * 0.38);
      colors[i * 3]     = 0 * bright;        // R
      colors[i * 3 + 1] = bright;             // G  (full green)
      colors[i * 3 + 2] = bright * 0.35;      // B  (slight cyan tint at bright spots)
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: true,
    });

    const hand = new THREE.Points(geo, mat);
    group.add(hand);

    // ── 2. Ambient scatter particles (tiny floating sparks around the hand) ──
    const sN = 250;
    const sPos = new Float32Array(sN * 3);
    const sSpeeds = [];
    for (let i = 0; i < sN; i++) {
      sPos[i * 3]     = (Math.random() - 0.5) * 2.4;
      sPos[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      sSpeeds.push(0.003 + Math.random() * 0.006);
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.PointsMaterial({
      color: 0x00ff66, size: 0.035, transparent: true, opacity: 0.4,
    });
    const sparks = new THREE.Points(sGeo, sMat);
    group.add(sparks);

    // ── 3. Green spotlight beam from top ──
    // Rendered as a vertical semi-transparent cone of lines
    const beamCount = 18;
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 0.35 - Math.PI * 0.175;
      const bGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.sin(angle) * 0.12, 2.6, 0),
        new THREE.Vector3(Math.sin(angle) * 0.9, -0.8, 0),
      ]);
      const bMat = new THREE.LineBasicMaterial({
        color: 0x00ff66, transparent: true, opacity: 0.04 + Math.random() * 0.04,
      });
      group.add(new THREE.Line(bGeo, bMat));
    }

    // ── 4. Glowing halo ring at palm level ──
    const hPts = [];
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      hPts.push(new THREE.Vector3(Math.cos(a) * 0.72, Math.sin(a) * 0.24 - 0.25, 0));
    }
    const hGeo = new THREE.BufferGeometry().setFromPoints(hPts);
    const hMat = new THREE.LineBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.18 });
    group.add(new THREE.Line(hGeo, hMat));

    // ── Mouse parallax ──
    let tx = 0, ty = 0, mx = 0, my = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);

    // ── Animate ──
    let raf;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gentle float / breathe
      group.position.y = Math.sin(t * 0.55) * 0.05;
      group.rotation.z = Math.sin(t * 0.25) * 0.04;

      // Slow y-rotation idle
      group.rotation.y = Math.sin(t * 0.2) * 0.15;

      // Mouse parallax
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      group.rotation.y += mx * 0.07;
      group.rotation.x  = -my * 0.12;

      // Sparks drift upward
      const sa = sGeo.getAttribute('position');
      for (let i = 0; i < sN; i++) {
        sa.array[i * 3 + 1] += sSpeeds[i];
        if (sa.array[i * 3 + 1] > 2.5) sa.array[i * 3 + 1] = -2.5;
      }
      sa.needsUpdate = true;

      // Pulse particle opacity
      mat.opacity = 0.88 + Math.sin(t * 1.4) * 0.07;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──
    const onResize = () => {
      if (!el) return;
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      geo.dispose(); mat.dispose();
      sGeo.dispose(); sMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] sm:h-[440px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
