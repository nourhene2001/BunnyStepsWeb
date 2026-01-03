"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import Bunny from "./bunny"
import UrgencySignal from "./UrgencySignal"
import ProgressOrb from "./progressorb"
import FloatingMessage from "./FloatingMesaage"

interface SceneProps {
  level: number
  xpProgress: number // 0 → 1
  urgent: boolean
  message?: string
}

export default function Scene({
  level,
  xpProgress,
  urgent,
  message,
}: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
      {/* Soft ambient light = calm */}
      <ambientLight intensity={0.6} />

      {/* Directional = focus */}
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* Background environment */}
      <Environment preset="sunset" />

      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      <ProgressOrb progress={xpProgress} />

      <Bunny level={level} urgent={urgent} />

      {urgent && <UrgencySignal />}

      {message && <FloatingMessage text={message} />}

      {/* Locked camera = less distraction */}
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
