import "./App.css";

function App() {
  return (
    <>
      <div id="playerContainer">
        <div id="player">
          <video
            id="video"
            loop
            muted
            autoPlay
            controls
            height={400}
            width={400}
            src="https://www.w3schools.com/tags/mov_bbb.mp4"
          />
        </div>
      </div>

      <button
        id="pipButton"
        onClick={async () => {
          const player = document.querySelector("#player");
          const container = document.querySelector("#playerContainer");

          if (!player || !container) return;

          const pipWindow =
            await window.documentPictureInPicture.requestWindow({
              width: 500,
              height: 500,
            });

          // Move to PiP window
          pipWindow.document.body.append(player);

          // Restore when PiP closes
          pipWindow.addEventListener("pagehide", () => {
            container.append(player);
          });
        }}
      >
        Open Picture-in-Picture window
      </button>
    </>
  );
}

export default App;