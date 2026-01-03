/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="three" />

import * as THREE from "three"
import { ReactThreeFiber } from "@react-three/fiber"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      meshStandardMaterial: ReactThreeFiber.Object3DNode<
        THREE.MeshStandardMaterial,
        typeof THREE.MeshStandardMaterial
      >
      icosahedronBufferGeometry: ReactThreeFiber.Object3DNode<
        THREE.IcosahedronBufferGeometry,
        typeof THREE.IcosahedronBufferGeometry
      >
      sphereBufferGeometry: ReactThreeFiber.Object3DNode<
        THREE.SphereBufferGeometry,
        typeof THREE.SphereBufferGeometry
      >
      torusBufferGeometry: ReactThreeFiber.Object3DNode<
        THREE.TorusBufferGeometry,
        typeof THREE.TorusBufferGeometry
      >
      ambientLight: ReactThreeFiber.Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      pointLight: ReactThreeFiber.Object3DNode<THREE.PointLight, typeof THREE.PointLight>
      directionalLight: ReactThreeFiber.Object3DNode<
        THREE.DirectionalLight,
        typeof THREE.DirectionalLight
      >
    }
  }
}
