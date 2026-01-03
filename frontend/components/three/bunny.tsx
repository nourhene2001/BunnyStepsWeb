"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function Bunny({
  level,
  urgent,
}: {
  level: number
  urgent: boolean
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    // Gentle breathing motion
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05

    // Turn red-ish if urgent (TypeScript-safe)
    const targetColor = urgent ? "#ef4444" : "#e5e7eb"
    ;(ref.current.material as THREE.MeshStandardMaterial).color.lerp(
      new THREE.Color(targetColor),
      0.05
    )
  })

  return (
    <mesh ref={ref} position={[0, -0.3, 0]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial roughness={0.4} />
    </mesh>
  )
}
