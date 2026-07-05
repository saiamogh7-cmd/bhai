import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Joint positions for a right hand (normalized, palm facing viewer)
// Each entry: [x, y, z]  — roughly -1..1 range, scaled later
const JOINTS = {
  // Wrist
  wrist:   [0, -1.6, 0],

  // Thumb
  thumb0:  [-0.55, -1.1, 0.1],
  thumb1:  [-0.85, -0.7, 0.15],
  thumb2:  [-1.0,  -0.3, 0.1],
  thumb3:  [-1.05,  0.1, 0.05],

  // Index
  index0:  [-0.42, -0.6, 0],
  index1:  [-0.5,   0.1, 0],
  index2:  [-0.5,   0.65, 0],
  index3:  [-0.48,  1.1, 0],
  index4:  [-0.46,  1.45, 0],

  // Middle
  mid0:    [-0.1, -0.55, 0],
  mid1:    [-0.1,  0.15, 0],
  mid2:    [-0.1,  0.75, 0],
  mid3:    [-0.08, 1.22, 0],
  mid4:    [-0.06, 1.6, 0],

  // Ring
  ring0:   [0.24, -0.58, 0],
  ring1:   [0.26,  0.1, 0],
  ring2:   [0.27,  0.68, 0],
  ring3:   [0.27,  1.14, 0],
  ring4:   [0.26,  1.48, 0],

  // Pinky
  pinky0:  [0.55, -0.65, 0],
  pinky1:  [0.6,  -0.05, 0],
  pinky2:  [0.62,  0.4, 0],
  pinky3:  [0.62,  0.75, 0],
  pinky4:  [0.61,  1.0, 0],
};

// Bone connections: pairs of joint keys
const BONES = [
  // Wrist → knuckles
  ['wrist', 'thumb0'],
  ['wrist', 'index0'],
  ['wrist', 'mid0'],
  ['wrist', 'ring0'],
  ['wrist', 'pinky0'],
  // Palm cross-bar
  ['index0','mid0'], ['mid0','ring0'], ['ring0','pinky0'],
  // Thumb chain
  ['thumb0','thumb1'], ['thumb1','thumb2'], ['thumb2','thumb3'],
  // Index chain
  ['index0','index1'], ['index1','index2'], ['index2','index3'], ['index3','index4'],
  // Middle chain
  ['mid0','mid1'],['mid1','mid2'],['mid2','mid3'],['mid3','mid4'],
  // Ring chain
  ['ring0','ring1'],['ring1','ring2'],['ring2','ring3'],['ring3','ring4'],
  // Pinky chain
  ['pinky0','pinky1'],['pinky1','pinky2'],['pinky2','pinky3'],['pinky3','pinky4'],
];

export default function HeroHand() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const W = el.clientWidth  || 340;
    const H = el.clientHeight || 380;

    // ── Scene ──
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const group = new THREE.Group();
    // Scale & slight tilt so hand fills the canvas nicely
    group.scale.setScalar(1.7);
    group.rotation.z = -0.18; // tiny clockwise lean
    scene.add(group);

    // ── Helper: vec3 from joint key ──
    const v3 = (key) => {
      const [x, y, z] = JOINTS[key];
      return new THREE.Vector3(x, y, z);
    };

    const GREEN = 0x00ff66;

    // ── 1. Glow nodes at every joint ──
    const nodeMat = new THREE.MeshBasicMaterial({ color: GREEN });
    Object.values(JOINTS).forEach(([x, y, z]) => {
      const size = 0.055 + Math.random() * 0.025;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), nodeMat);
      mesh.position.set(x, y, z);
      group.add(mesh);
    });

    // ── 2. Bone lines ──
    const lineMat = new THREE.LineBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity: 0.65,
    });

    BONES.forEach(([a, b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([v3(a), v3(b)]);
      group.add(new THREE.Line(geo, lineMat));
    });

    // ── 3. Halo glow ring around palm ──
    const haloMat = new THREE.LineBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity: 0.12,
    });
    const haloGeo = new THREE.RingGeometry(0.85, 0.88, 64);
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 65 }, (_, i) => {
          const a = (i / 64) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(a) * 0.86, Math.sin(a) * 0.86 - 0.2, 0);
        })
      ),
      haloMat
    ));

    // ── 4. Floating particles around the hand ──
    const pCount = 80;
    const pPos   = new Float32Array(pCount * 3);
    const pSpeeds = [];
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 2.6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 3.8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      pSpeeds.push(0.004 + Math.random() * 0.008);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: GREEN, size: 0.04, transparent: true, opacity: 0.55,
    });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    // ── 5. Digit rain — tiny vertical columns of numbers ──
    // (rendered as a 2-D canvas texture on a plane behind the hand)
    const rainCanvas = document.createElement('canvas');
    rainCanvas.width  = 256;
    rainCanvas.height = 512;
    const rCtx = rainCanvas.getContext('2d');
    const rainTex = new THREE.CanvasTexture(rainCanvas);
    const rainMat = new THREE.MeshBasicMaterial({
      map: rainTex, transparent: true, opacity: 0.18, depthWrite: false,
    });
    const rainMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 6.8), rainMat);
    rainMesh.position.z = -0.3;
    group.add(rainMesh);

    const rainDrops = Array.from({ length: 22 }, () => ({
      x: Math.random() * 256,
      y: Math.random() * 512,
      speed: 1.5 + Math.random() * 3,
    }));

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

      // Gentle floating breath
      group.position.y = Math.sin(t * 0.6) * 0.06;

      // Slow idle rotation
      group.rotation.y = Math.sin(t * 0.3) * 0.2;

      // Mouse parallax
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      group.rotation.x = -my * 0.18;
      group.rotation.y += mx * 0.06;

      // Particle float upward
      const pa = pGeo.getAttribute('position');
      for (let i = 0; i < pCount; i++) {
        pa.array[i * 3 + 1] += pSpeeds[i];
        if (pa.array[i * 3 + 1] > 2.2) pa.array[i * 3 + 1] = -2.2;
      }
      pa.needsUpdate = true;

      // Rain canvas update
      rCtx.fillStyle = 'rgba(0,0,0,0.25)';
      rCtx.fillRect(0, 0, 256, 512);
      rCtx.font = '11px monospace';
      rainDrops.forEach((d) => {
        rCtx.fillStyle = `rgba(0,255,102,${0.4 + Math.random() * 0.6})`;
        rCtx.fillText(Math.floor(Math.random() * 10), d.x, d.y);
        d.y += d.speed;
        if (d.y > 512) d.y = 0;
      });
      rainTex.needsUpdate = true;

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
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px] sm:h-[400px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
