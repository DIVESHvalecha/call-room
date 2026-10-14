import { toPng } from "html-to-image";

export async function shareCardPNG(el: HTMLElement, filename = "call-room-card.png"): Promise<boolean> {
  try {
    // Generate high-resolution PNG maintaining natural aspect ratio without distorted stretching
    const dataUrl = await toPng(el, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: "#070b1e",
      style: {
        transform: "none",
        margin: "0 auto",
      },
      filter: (node) => {
        if (node instanceof HTMLElement && (node.dataset.noExport === "true" || node.classList.contains("no-export"))) {
          return false;
        }
        return true;
      },
    });

    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    const nav = navigator as Navigator & {
      share?: (d: ShareData) => Promise<void>;
      canShare?: (d: ShareData) => boolean;
    };

    if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: "Dream11 Call Room Collectible Card",
          text: "Check out my Call Room live prediction card!",
        });
        return true;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return true;
        }
      }
    }

    // Direct download trigger
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error("shareCardPNG error:", err);
    return false;
  }
}

export async function copyChallengeLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#challenge-sample`);
    return true;
  } catch {
    return false;
  }
}
