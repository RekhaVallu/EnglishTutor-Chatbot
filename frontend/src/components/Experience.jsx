import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");

  useEffect(() => {
    if (!loading) {
      setLoadingText("");
      return;
    }
    const interval = setInterval(() => {
      setLoadingText((prev) => (prev.length > 2 ? "." : prev + "."));
    }, 800);
    return () => clearInterval(interval);
  }, [loading]);

  if (!loading) return null;

  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX="left" anchorY="bottom">
        {loadingText}
        <meshBasicMaterial attach="material" color="black" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef();

  useEffect(() => {
    cameraControls.current.setLookAt(0, 1.6, 4, 0, 1.5, 0, false);
  }, []);

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      {/* Wrapping Dots in Suspense prevents a blink when Troika/font loads */}
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      <Avatar />
      <ContactShadows opacity={0.7} />
    </>
  );
};