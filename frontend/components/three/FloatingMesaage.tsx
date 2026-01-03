"use client"

import { Text } from "@react-three/drei"

export default function FloatingMessage({
  text,
}: {
  text: string
}) {
  return (
    <Text
      position={[0, 2.8, 0]}
      fontSize={0.35}
      color="#e5e7eb"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  )
}
