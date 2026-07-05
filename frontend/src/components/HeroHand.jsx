import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Point-in-capsule test ──────────────────────────────────────────────────────
function inCapsule(px, py, pz, ax, ay, az, bx, by, bz, r) {
  const abx = bx-ax, aby = by-ay, abz = bz-az;
  const apx = px-ax, apy = py-ay, apz = pz-az;
  const t = Math.max(0, Math.min(1, (apx*abx+apy*aby+apz*abz)/(abx*abx+aby*aby+abz*abz)));
  const dx = px-(ax+t*abx), dy = py-(ay+t*aby), dz = pz-(az+t*abz);
  return dx*dx + dy*dy + dz*dz < r*r;
}

// ── Hand capsule skeleton ─────────────────────────────────────────────────────
// [ax,ay,az, bx,by,bz, radius]
const SEGS = [
  // Palm (3 overlapping wide capsules)
  [-0.38,-0.7,0,  0.38,-0.7,0,  0.40],
  [-0.34,-0.25,0, 0.34,-0.25,0, 0.38],
  [-0.30, 0.1,0,  0.30, 0.1,0,  0.33],
  // Palm thickness (front-back)
  [-0.1,-0.4,0.15, 0.1,-0.4,-0.15, 0.30],

  // Thumb (angled left+forward)
  [-0.35,-0.4,0.08, -0.65,-0.05,0.14, 0.17],
  [-0.65,-0.05,0.14,-0.84, 0.30,0.10, 0.14],
  [-0.84, 0.30,0.10,-0.93, 0.58,0.06, 0.11],

  // Index
  [-0.30, 0.10,0, -0.32, 0.58,0, 0.13],
  [-0.32, 0.58,0, -0.31, 1.08,0, 0.12],
  [-0.31, 1.08,0, -0.30, 1.52,0, 0.10],

  // Middle (tallest)
  [-0.06, 0.10,0, -0.06, 0.62,0, 0.13],
  [-0.06, 0.62,0, -0.05, 1.18,0, 0.12],
  [-0.05, 1.18,0, -0.04, 1.68,0, 0.10],

  // Ring
  [ 0.20, 0.10,0,  0.22, 0.60,0, 0.12],
  [ 0.22, 0.60,0,  0.22, 1.12,0, 0.11],
  [ 0.22, 1.12,0,  0.21, 1.52,0, 0.09],

  // Pinky
  [ 0.46, 0.00,0,  0.49, 0.44,0, 0.10],
  [ 0.49, 0.44,0,  0.49, 0.82,0, 0.09],
  [ 0.49, 0.82,0,  0.47, 1.08,0, 0.08],
];

function inHand(px, py, pz) {
  for (const s of SEGS) {
    if (inCapsule(px, py, pz, s[0],s[1],s[2], s[3],s[4],s[5], s[6])) return true;
  }
  return false;
}

function buildCloud(count) {
  const pos = [], brightness = [];
  const BX = 1.15, BY = 1.45, BZ = 0.28;
  while (pos.length < count * 3) {
    const x = (Math.random()*2-1)*BX;
    const y = (Math.random()*2-1)*BY + 0.35; // shift upward
    const z = (Math.random()*2-1)*BZ;
    if (inHand(x, y, z)) {
      pos.push(x, y, z);
      // Spotlight: green cone from top-centre, dimmer toward edges/base
      const dist = Math.sqrt(x*x*0.6 + (y-1.6)*(y-1.6)*0.4);
      const b = Math.max(0.05, 1.0 - dist * 0.55 + Math.random()*0.1);
      brightness.push(b);
    }
  }
  return { pos: new Float32Array(pos), brightness };
}

export default function HeroHand() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = el.clientWidth || 400, H = el.clientHeight || 460;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(36, W/H, 0.1, 100);
    camera.position.set(0, 0.45, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.scale.setScalar(1.6);
    scene.add(root);

    // ── LAYER 1: Dense core cloud (small bright dots) ──
    const N1 = 18000;
    const { pos: p1, brightness: b1 } = buildCloud(N1);
    const col1 = new Float32Array(N1 * 3);
    for (let i = 0; i < N1; i++) {
      const b = b1[i];
      col1[i*3]   = 0;
      col1[i*3+1] = b;                 // G
      col1[i*3+2] = b * 0.28;          // slight cyan on bright spots
    }
    const g1 = new THREE.BufferGeometry();
    g1.setAttribute('position', new THREE.BufferAttribute(p1, 3));
    g1.setAttribute('color',    new THREE.BufferAttribute(col1, 3));
    const m1 = new THREE.PointsMaterial({
      size: 0.022, vertexColors: true, transparent: true, opacity: 1.0, sizeAttenuation: true,
    });
    root.add(new THREE.Points(g1, m1));

    // ── LAYER 2: Glow halo layer (slightly larger, low opacity) ──
    const N2 = 6000;
    const { pos: p2, brightness: b2 } = buildCloud(N2);
    const col2 = new Float32Array(N2 * 3);
    for (let i = 0; i < N2; i++) {
      const b = b2[i] * 0.6;
      col2[i*3]   = 0;
      col2[i*3+1] = b;
      col2[i*3+2] = b * 0.4;
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(p2, 3));
    g2.setAttribute('color',    new THREE.BufferAttribute(col2, 3));
    const m2 = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.28, sizeAttenuation: true,
    });
    root.add(new THREE.Points(g2, m2));

    // ── LAYER 3: Edge scatter (tiny micro-sparks around the hand) ──
    const N3 = 800;
    const sp3 = new Float32Array(N3 * 3);
    const spd = [];
    for (let i = 0; i < N3; i++) {
      sp3[i*3]   = (Math.random()-0.5) * 2.6;
      sp3[i*3+1] = (Math.random()-0.5) * 4.2;
      sp3[i*3+2] = (Math.random()-0.5) * 0.8;
      spd.push(0.003 + Math.random()*0.005);
    }
    const g3 = new THREE.BufferGeometry();
    g3.setAttribute('position', new THREE.BufferAttribute(sp3, 3));
    const m3 = new THREE.PointsMaterial({
      color: 0x00ff66, size: 0.028, transparent: true, opacity: 0.35,
    });
    root.add(new THREE.Points(g3, m3));

    // ── Spotlight beam rays (fan of lines from above) ──
    for (let i = 0; i < 24; i++) {
      const a = (i/24)*Math.PI*0.4 - Math.PI*0.20;
      const bg = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.sin(a)*0.08, 2.8, 0),
        new THREE.Vector3(Math.sin(a)*1.1, -0.9, 0),
      ]);
      root.add(new THREE.Line(bg, new THREE.LineBasicMaterial({
        color: 0x00ff66, transparent: true, opacity: 0.025 + Math.random()*0.04,
      })));
    }

    // ── Bright core top-glow (small bright points at fingertips) ──
    const tipPositions = [
      [-0.30, 1.55, 0], [-0.04, 1.70, 0], [0.21, 1.54, 0],
      [0.47, 1.10, 0],  [-0.92, 0.60, 0.07],
    ];
    tipPositions.forEach(([tx, ty, tz]) => {
      for (let k = 0; k < 40; k++) {
        const tg = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(tx + (Math.random()-0.5)*0.12, ty + Math.random()*0.18, tz)
        ]);
        root.add(new THREE.Points(tg, new THREE.PointsMaterial({
          color: 0xaaffcc, size: 0.030, transparent: true, opacity: 0.6 + Math.random()*0.4,
        })));
      }
    });

    // ── Mouse parallax ──
    let tx=0,ty=0,mx=0,my=0;
    const onMov = (e) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX-r.left)/r.width -0.5)*2;
      ty = ((e.clientY-r.top) /r.height-0.5)*2;
    };
    window.addEventListener('mousemove', onMov);

    // ── Animation ──
    let raf;
    const clk = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clk.getElapsedTime();

      // Breathe
      root.position.y = Math.sin(t*0.5)*0.06;
      root.rotation.z = Math.sin(t*0.22)*0.035;

      // Slow idle y-sway
      root.rotation.y = Math.sin(t*0.18)*0.18;

      // Mouse parallax
      mx += (tx-mx)*0.05; my += (ty-my)*0.05;
      root.rotation.y += mx*0.08;
      root.rotation.x  = -my*0.10;

      // Sparks float up
      const sa = g3.getAttribute('position');
      for (let i = 0; i < N3; i++) {
        sa.array[i*3+1] += spd[i];
        if (sa.array[i*3+1] > 2.8) sa.array[i*3+1] = -2.8;
      }
      sa.needsUpdate = true;

      // Pulse brightness
      m1.opacity = 0.90 + Math.sin(t*1.2)*0.08;
      m2.opacity = 0.22 + Math.sin(t*1.5)*0.06;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!el) return;
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMov);
      window.removeEventListener('resize', onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      [g1,g2,g3].forEach(g=>g.dispose());
      [m1,m2,m3].forEach(m=>m.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="w-full h-[300px] sm:h-[460px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
