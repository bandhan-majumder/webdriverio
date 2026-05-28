import { useEffect, useRef, useState } from "react";

function CssPip() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const openCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const constraints = { video: true, audio: true };
      video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStarted(true);
    } catch (error) {
      console.error("> Argh! Failed to open camera:", error);
    }
  };

  const openPipWindow = async () => {
    if (!("documentPictureInPicture" in window)) {
      console.warn("Document Picture-in-Picture is not supported.");
      return;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) return;

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 500,
        height: 500,
      }) as Window;
      pipWindowRef.current = pipWindow;

      document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
        pipWindow.document.head.appendChild(el.cloneNode(true));
      });

      pipWindow.document.body.style.cssText = "margin:0;background:#000;";

      try {
        pipWindow.moveTo(-9999, -9999);
      } catch {
        // moveTo not supported — fallback: keep the window tiny
        pipWindow.resizeTo(1, 1);
      }

      const player = playerRef.current;
      if (player) {
        pipWindow.document.body.appendChild(player);
      }

      pipWindow.addEventListener("pagehide", () => {
        const player = playerRef.current;
        if (player) containerRef.current?.appendChild(player);
        pipWindowRef.current = null;
      });
    } catch (error) {
      console.error("> Argh! Failed to open PiP window:", error);
    }
  };

  useEffect(() => {
    openCamera();
  }, []);

  useEffect(() => {
    if (cameraStarted) {
      openPipWindow();
    }
  }, [cameraStarted]);

  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.hidden) {
        const pip = pipWindowRef.current;
        if (pip && !pip.closed) {
          try {
            pip.moveTo(100, 100);
          } catch {
            const player = playerRef.current;
            if (player) containerRef.current?.appendChild(player);
            pip.close();
            pipWindowRef.current = null;
            await openPipWindow();
          }
        }
      } else {
        const pip = pipWindowRef.current;
        if (pip && !pip.closed) {
          const player = playerRef.current;
          if (player) containerRef.current?.appendChild(player);
          pip.close();
          pipWindowRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [cameraStarted]);

  return (
    <>
      <div id="playerContainer" ref={containerRef}>
        <div id="player" ref={playerRef}>
          <video
            ref={videoRef}
            autoPlay
            controls
            muted
            height={400}
            width={400}
          />
        </div>
      </div>
      <p style={{ marginTop: 12 }}>
        CSS PiP experiment — window hidden off-screen on mount, shown on tab switch.
      </p>
    </>
  );
}

export default CssPip;
