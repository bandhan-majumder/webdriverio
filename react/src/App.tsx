// based on this: https://googlechrome.github.io/samples/media-session/video-conferencing.html
import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const pipWindowRef = useRef(null);

  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoPip, setAutoPip] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  const log = (msg) => console.log(msg);

  const openDocumentPip = async () => {
    const player = playerRef.current;
    const container = containerRef.current;
    if (!player || !container) return;
    if (!("documentPictureInPicture" in window)) {
      // Fallback to element PiP
      const video = videoRef.current;
      if (video !== document.pictureInPictureElement) {
        await video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
      return;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) return;

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 500,
      height: 500,
    });
    pipWindowRef.current = pipWindow;

    document.querySelectorAll('link[rel="stylesheet"], style').forEach((style) => {
      pipWindow.document.head.appendChild(style.cloneNode(true));
    });

    pipWindow.document.body.style = "margin:0;background:#000;";
    pipWindow.document.body.appendChild(player);

    pipWindow.addEventListener("pagehide", () => {
      containerRef.current?.appendChild(player);
      pipWindowRef.current = null;
    });
  };

  // Mirrors: openCameraButton click
  const handleOpenCamera = async () => {
    const video = videoRef.current;
    try {
      const constraints = { video: true, audio: true };
      video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
      setIsMicrophoneActive(true);
      setIsCameraActive(true);
      navigator.mediaSession.setMicrophoneActive(true);
      navigator.mediaSession.setCameraActive(true);
      setCameraStarted(true);
    } catch (error) {
      log(`> Argh! ${error}`);
    }
  };

  // Mirrors: togglePipButton click
  const handleTogglePip = async () => {
    try {
      await openDocumentPip();
    } catch (error) {
      log(`> Argh! ${error}`);
    }
  };

  // Mirrors: autoPipCheckbox input
  const handleAutoPipToggle = () => {
    const next = !autoPip;
    setAutoPip(next);

    if (!next) {
      navigator.mediaSession.setActionHandler("enterpictureinpicture", null);
      return;
    }

    try {
      navigator.mediaSession.setActionHandler(
        "enterpictureinpicture",
        async ({ enterPictureInPictureReason }) => {
          if (enterPictureInPictureReason === "useraction") {
            log('> User clicked "Enter Picture-in-Picture" icon.');
          } else if (enterPictureInPictureReason === "contentoccluded") {
            log("> Automatically enter picture-in-picture.");
          }
          await openDocumentPip();
        }
      );
    } catch (error) {
      log('Warning! The "enterpictureinpicture" media session action is not supported.');
    }
  };

  // Mirrors: togglemicrophone, togglecamera, hangup handlers
  useEffect(() => {
    try {
      navigator.mediaSession.setActionHandler("togglemicrophone", () => {
        log('> User clicked "Toggle Mic" icon.');
        const next = !isMicrophoneActive;
        setIsMicrophoneActive(next);
        navigator.mediaSession.setMicrophoneActive(next);
      });
    } catch (error) {
      log('Warning! The "togglemicrophone" media session action is not supported.');
    }

    try {
      navigator.mediaSession.setActionHandler("togglecamera", () => {
        log('> User clicked "Toggle Camera" icon.');
        const next = !isCameraActive;
        setIsCameraActive(next);
        navigator.mediaSession.setCameraActive(next);
      });
    } catch (error) {
      log('Warning! The "togglecamera" media session action is not supported.');
    }

    try {
      navigator.mediaSession.setActionHandler("hangup", () => {
        log('> User clicked "Hang Up" icon.');
        const video = videoRef.current;
        const tracks = video.srcObject?.getTracks() ?? [];
        tracks.forEach((track) => track.stop());
        video.srcObject = null;

        if (pipWindowRef.current && !pipWindowRef.current.closed) {
          pipWindowRef.current.close();
          pipWindowRef.current = null;
        } else {
          document.exitPictureInPicture().catch(() => {});
        }

        setCameraStarted(false);
        setIsMicrophoneActive(false);
        setIsCameraActive(false);
        setAutoPip(false);
      });
    } catch (error) {
      log('Warning! The "hangup" media session action is not supported.');
    }

    // Close PiP when returning to tab
    const onVisibilityChange = () => {
      if (!document.hidden && pipWindowRef.current && !pipWindowRef.current.closed) {
        containerRef.current?.appendChild(playerRef.current);
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.mediaSession.setActionHandler("enterpictureinpicture", null);
      navigator.mediaSession.setActionHandler("togglemicrophone", null);
      navigator.mediaSession.setActionHandler("togglecamera", null);
      navigator.mediaSession.setActionHandler("hangup", null);
    };
  }, [isMicrophoneActive, isCameraActive]);

  return (
    <>
      <div id="playerContainer" ref={containerRef}>
        <div id="player" ref={playerRef}>
          <video
            id="video"
            ref={videoRef}
            autoPlay
            controls
            muted
            height={400}
            width={400}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <button onClick={handleOpenCamera} disabled={cameraStarted}>
          Open Camera
        </button>

        <button onClick={handleTogglePip} disabled={!cameraStarted}>
          Toggle Picture-in-Picture
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={autoPip}
            onChange={handleAutoPipToggle}
            disabled={!cameraStarted}
          />
          Automatically enter Picture-in-Picture
        </label>
      </div>
    </>
  );
}

export default App;