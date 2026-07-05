import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 300;
    const height = containerRef.current.clientHeight || 300;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    
    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 7;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 4. Parallax Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 5. DOTDNA Threat Globe (glowing lime green nodes connected by thin lines)
    const globeGeometry = new THREE.IcosahedronGeometry(2.0, 2); 
    
    // Wireframe connection lines
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff66, // Pure Neon Green
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const globeLines = new THREE.Mesh(globeGeometry, lineMaterial);
    masterGroup.add(globeLines);

    // Node dots
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x00ff66, // Pure Neon Green
      size: 0.07,
      transparent: true,
      opacity: 0.85,
    });
    const globeNodes = new THREE.Points(globeGeometry, nodeMaterial);
    masterGroup.add(globeNodes);

    // 6. Central Shield/Core Icon (rotating inside the globe)
    const coreGeometry = new THREE.OctahedronGeometry(0.7, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff66, // Match matching green core
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    masterGroup.add(coreMesh);

    // 7. Drifting Upward Data Packets (particles)
    const particleCount = 70;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 2.5;
      positions[i * 3] = Math.cos(theta) * radius; // X
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0; // Y
      positions[i * 3 + 2] = Math.sin(theta) * radius; // Z
      
      speeds.push(0.008 + Math.random() * 0.015); // Upward float speed
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const packetMaterial = new THREE.PointsMaterial({
      color: 0x00ff66, // Pure Neon Green
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const dataPackets = new THREE.Points(particleGeometry, packetMaterial);
    masterGroup.add(dataPackets);

    // 8. Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      targetX = x / rect.width;
      targetY = y / rect.height;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 9. Animation Loop
    let animationId;
    const posAttribute = particleGeometry.getAttribute('position');

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Slow auto-rotations
      globeLines.rotation.y += 0.0008;
      globeLines.rotation.x += 0.0004;
      globeNodes.rotation.y += 0.0008;
      globeNodes.rotation.x += 0.0004;

      coreMesh.rotation.y -= 0.002;
      coreMesh.rotation.z += 0.001;

      // Animate drifting data packets (upward)
      const positionsArr = posAttribute.array;
      for (let i = 0; i < particleCount; i++) {
        positionsArr[i * 3 + 1] += speeds[i]; // Move Y up
        
        // Reset if drifted too high
        if (positionsArr[i * 3 + 1] > 3.5) {
          positionsArr[i * 3 + 1] = -3.5;
        }
      }
      posAttribute.needsUpdate = true;

      // Interpolate mouse movements for smooth parallax tilt
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      
      masterGroup.rotation.y = mouseX * 0.5;
      masterGroup.rotation.x = -mouseY * 0.5;

      renderer.render(scene, camera);
    };
    animate();

    // 10. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up resources on unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        if (containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      globeGeometry.dispose();
      lineMaterial.dispose();
      nodeMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeometry.dispose();
      packetMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[220px] sm:h-[320px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
