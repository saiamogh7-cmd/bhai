import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 300;
    const height = mountRef.current.clientHeight || 300;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Create a shield/globe technical model using an Icosahedron
    const geometry = new THREE.IcosahedronGeometry(2.0, 1);
    
    // Outer wireframe mesh (Cyan)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan-500
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const mesh = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(mesh);

    // Outer vertices / glowing points (Cyan-400)
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x22d3ee, // Cyan-400
      size: 0.08,
      transparent: true,
      opacity: 0.65,
    });
    const points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

    // Inner core shield element (small wireframe octahedron)
    const innerGeo = new THREE.OctahedronGeometry(0.9, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x0e7490, // Cyan-700
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMaterial);
    scene.add(innerMesh);

    // Animation variables
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Understated, slow-moving rotation
      mesh.rotation.y += 0.0012;
      mesh.rotation.x += 0.0006;
      
      points.rotation.y += 0.0012;
      points.rotation.x += 0.0006;
      
      innerMesh.rotation.y -= 0.002;
      innerMesh.rotation.x -= 0.001;
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        // Safe check to avoid DOM exceptions
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      geometry.dispose();
      wireframeMaterial.dispose();
      pointsMaterial.dispose();
      innerGeo.dispose();
      innerMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="w-full h-[220px] sm:h-[300px] flex items-center justify-center relative overflow-hidden"
    />
  );
}
