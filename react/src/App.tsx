// based on this: https://googlechrome.github.io/samples/media-session/video-conferencing.html
import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoPip, setAutoPip] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);

  const log = (msg: string) => console.log(msg);

  const openDocumentPip = async () => {
    const player = playerRef.current;
    const container = containerRef.current;
    if (!player || !container) return;
    if (!("documentPictureInPicture" in window)) {
      const video = videoRef.current;
      if (!video) return;
      if (video !== document.pictureInPictureElement) {
        await video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
      return;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) return;

    const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
      width: 500,
      height: 500,
    }) as Window;
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

  // Register enterpictureinpicture handler on mount
  useEffect(() => {
    try {
      navigator.mediaSession.setActionHandler(
        "enterpictureinpicture" as MediaSessionAction,
        async (details) => {
          const reason = (details as any).enterPictureInPictureReason;
          if (reason === "useraction") {
            log('> User clicked "Enter Picture-in-Picture" icon.');
          } else if (reason === "contentoccluded") {
            log("> Automatically enter picture-in-picture.");
          }
          await openDocumentPip();
        }
      );
    } catch (error) {
      log('Warning! The "enterpictureinpicture" media session action is not supported.');
    }

    return () => {
      navigator.mediaSession.setActionHandler("enterpictureinpicture" as MediaSessionAction, null);
    };
  }, []);

  const handleOpenCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
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

  // Auto-open camera on mount
  useEffect(() => {
    handleOpenCamera();
  }, []);

  const handleTogglePip = async () => {
    try {
      await openDocumentPip();
    } catch (error) {
      log(`> Argh! ${error}`);
    }
  };

  const handleAutoPipToggle = () => {
    const next = !autoPip;
    setAutoPip(next);

    if (!next) {
      navigator.mediaSession.setActionHandler("enterpictureinpicture" as MediaSessionAction, null);
      return;
    }

    try {
      navigator.mediaSession.setActionHandler(
        "enterpictureinpicture" as MediaSessionAction,
        async (details) => {
          const reason = (details as any).enterPictureInPictureReason;
          if (reason === "useraction") {
            log('> User clicked "Enter Picture-in-Picture" icon.');
          } else if (reason === "contentoccluded") {
            log("> Automatically enter picture-in-picture.");
          }
          await openDocumentPip();
        }
      );
    } catch (error) {
      log('Warning! The "enterpictureinpicture" media session action is not supported.');
    }
  };

  useEffect(() => {
    try {
      navigator.mediaSession.setActionHandler("togglemicrophone" as MediaSessionAction, () => {
        log('> User clicked "Toggle Mic" icon.');
        const next = !isMicrophoneActive;
        setIsMicrophoneActive(next);
        navigator.mediaSession.setMicrophoneActive(next);
      });
    } catch (error) {
      log('Warning! The "togglemicrophone" media session action is not supported.');
    }

    try {
      navigator.mediaSession.setActionHandler("togglecamera" as MediaSessionAction, () => {
        log('> User clicked "Toggle Camera" icon.');
        const next = !isCameraActive;
        setIsCameraActive(next);
        navigator.mediaSession.setCameraActive(next);
      });
    } catch (error) {
      log('Warning! The "togglecamera" media session action is not supported.');
    }

    try {
      navigator.mediaSession.setActionHandler("hangup" as MediaSessionAction, () => {
        log('> User clicked "Hang Up" icon.');
        const video = videoRef.current;
        if (!video) return;
        const tracks = (video.srcObject as MediaStream)?.getTracks() ?? [];
        tracks.forEach((track: MediaStreamTrack) => track.stop());
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

    const onVisibilityChange = () => {
      if (!document.hidden && pipWindowRef.current && !pipWindowRef.current.closed) {
        if (playerRef.current) containerRef.current?.appendChild(playerRef.current);
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.mediaSession.setActionHandler("togglemicrophone" as MediaSessionAction, null);
      navigator.mediaSession.setActionHandler("togglecamera" as MediaSessionAction, null);
      navigator.mediaSession.setActionHandler("hangup" as MediaSessionAction, null);
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