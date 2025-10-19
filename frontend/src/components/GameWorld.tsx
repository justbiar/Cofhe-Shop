import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Sphere, Torus, Text } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

function FloatingCube({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.5
    }
  })

  return (
    <Box
      ref={meshRef}
      position={position}
      scale={hovered ? 1.2 : 1}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => console.log('Cube clicked!')}
    >
      <meshStandardMaterial 
        color={hovered ? "#ff6b6b" : "#4ecdc4"} 
        metalness={0.8}
        roughness={0.2}
      />
    </Box>
  )
}

function RotatingSphere({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <Sphere ref={meshRef} position={position}>
      <meshStandardMaterial 
        color="#ffd93d" 
        metalness={0.6}
        roughness={0.4}
      />
    </Sphere>
  )
}

function SpinningTorus({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02
      meshRef.current.rotation.z += 0.01
    }
  })

  return (
    <Torus ref={meshRef} position={position} args={[2, 0.5, 16, 32]}>
      <meshStandardMaterial 
        color="#a8e6cf" 
        metalness={0.7}
        roughness={0.3}
      />
    </Torus>
  )
}

export default function GameWorld() {
  return (
    <group>
      {/* Ground */}
      <Box position={[0, -1, 0]} args={[20, 2, 20]}>
        <meshStandardMaterial color="#8b4513" />
      </Box>

      {/* Floating cubes */}
      <FloatingCube position={[-5, 2, -5]} />
      <FloatingCube position={[5, 3, -3]} />
      <FloatingCube position={[-3, 2.5, 5]} />
      <FloatingCube position={[4, 4, 4]} />

      {/* Rotating spheres */}
      <RotatingSphere position={[-8, 1, 0]} />
      <RotatingSphere position={[8, 1.5, 0]} />
      <RotatingSphere position={[0, 1, -8]} />
      <RotatingSphere position={[0, 2, 8]} />

      {/* Spinning torus */}
      <SpinningTorus position={[0, 3, 0]} />

      {/* Game title */}
      <Text
        position={[0, 6, 0]}
        fontSize={2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        CoFHE Shop
      </Text>

      {/* Interactive elements */}
      <Box position={[0, 0.5, -10]} args={[1, 1, 1]}>
        <meshStandardMaterial 
          color="#ff4757"
          transparent
          opacity={0.8}
        />
      </Box>

      <Text
        position={[0, 1.5, -10]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Click to interact!
      </Text>
    </group>
  )
}


