const record = document.getElementById("record");
const recordWrap = document.querySelector(".record-wrap") || record;
const seek = document.getElementById("seek");
const audio = document.getElementById("audio");

let pendingSeek = null;
let ignoreClick = false;

const rotationPeriodSeconds = 6;
let rotationRaf = null;

const updateRotation = () => {
  if (!Number.isFinite(audio.duration)) {
    return;
  }
  const angle = (audio.currentTime / rotationPeriodSeconds) * 360;
  record.style.transform = `rotate(${angle}deg)`;
  if (!audio.paused) {
    rotationRaf = requestAnimationFrame(updateRotation);
  }
};

const setSpinning = (isSpinning) => {
  if (isSpinning) {
    cancelAnimationFrame(rotationRaf);
    updateRotation();
  } else {
    cancelAnimationFrame(rotationRaf);
    updateRotation();
  }
};

const updateSeek = () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seek.max = audio.duration;
    seek.value = audio.currentTime;
  }
};

const play = () => {
  audio.loop = true;
  audio.muted = false;
  audio.volume = 1;
  audio
    .play()
    .then(() => {
      setSpinning(true);
    })
    .catch(() => {
      // Mobile kann Play blockieren; erneuter Tap hilft.
    });
};

const pause = () => {
  audio.pause();
  setSpinning(false);
};

const togglePlayback = () => {
  if (audio.paused) {
    play();
  } else {
    pause();
  }
};

const handleSeek = (event) => {
  const target = event.target;
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = Number(target.value);
    updateSeek();
  } else {
    pendingSeek = Number(target.value);
  }
};

const applyPendingSeek = () => {
  if (pendingSeek !== null && Number.isFinite(audio.duration)) {
    audio.currentTime = Math.min(audio.duration, pendingSeek);
    pendingSeek = null;
  }
  updateSeek();
};

const registerPlaybackHandler = () => {
  if (!recordWrap) {
    return;
  }
  const handler = (event) => {
    if (event) {
      event.preventDefault();
    }
    ignoreClick = true;
    togglePlayback();
    window.setTimeout(() => {
      ignoreClick = false;
    }, 400);
  };
  if (window.PointerEvent) {
    recordWrap.addEventListener("pointerdown", handler, { passive: false });
    recordWrap.addEventListener(
      "pointerup",
      (event) => {
        event.preventDefault();
      },
      { passive: false }
    );
    recordWrap.addEventListener("click", () => {
      if (!ignoreClick) {
        togglePlayback();
      }
    });
  } else {
    recordWrap.addEventListener("touchstart", handler, { passive: false });
    recordWrap.addEventListener("click", () => {
      if (!ignoreClick) {
        togglePlayback();
      }
    });
  }
};

registerPlaybackHandler();

seek.addEventListener("input", handleSeek);
seek.addEventListener("change", handleSeek);

audio.addEventListener("loadedmetadata", applyPendingSeek);
audio.addEventListener("timeupdate", updateSeek);
audio.addEventListener("pause", () => setSpinning(false));
audio.addEventListener("play", () => setSpinning(true));
audio.addEventListener("seeked", updateRotation);

audio.load();
