"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export default function ProgressOrb({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    const scale = 0.8 + progress * 1.2
    ref.current.scale.set(scale, scale, scale)
  })

  return (
    <mesh ref={ref} position={[0, 0.8, -1.5]}>
      <icosahedronBufferGeometry args={[0.4, 1]} />
      <meshStandardMaterial
        emissive="#7c3aed"
        emissiveIntensity={progress * 2}
        color="#4c1d95"
      />
    </mesh>
  )
}
