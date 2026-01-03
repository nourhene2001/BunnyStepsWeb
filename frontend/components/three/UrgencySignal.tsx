"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function UrgencySignal() {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 4) * 0.1
    ref.current.scale.set(1 + pulse, 1 + pulse, 1)
  })

  return (
    <mesh ref={ref} position={[0, 2, 0]}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <meshBasicMaterial color="#f97316" />
    </mesh>
  )
}
