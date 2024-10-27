import { storage } from "wxt/storage";
import { DEFAULT_SETTINGS, Settings } from "@/lib/settings";
import {
  assertIsElement,
  findAspectRatioContainer,
  findImagesContainer,
  findInvalidContainer,
  getImageProportions,
  patchStyle,
  resetStyles,
} from "@/lib/utils";

export default defineContentScript({
  matches: ["*://bsky.app/*"],
  runAt: "document_end",
  main() {
    const observer = new MutationObserver(processImages);
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

async function processImages() {
  const enableLayout =
    (await storage.getItem<boolean>("local:enableLayout")) ??
    DEFAULT_SETTINGS.enableLayout;
  const dimDarkModeImages =
    (await storage.getItem<boolean>("local:dimDarkModeImages")) ??
    DEFAULT_SETTINGS.dimDarkModeImages;

  if (!enableLayout) resetStyles("enableLayout");
  if (!dimDarkModeImages) resetStyles("dimDarkModeImages");

  const images = document.querySelectorAll("img:not([draggable='false'])");
  const processed = new Set<Element>();
  const isDarkTheme =
    document.documentElement.classList.contains("theme--dim") ||
    document.documentElement.classList.contains("theme--dark");

  if (dimDarkModeImages) {
    document.querySelectorAll("img").forEach((img) => {
      assertIsElement(img, HTMLImageElement);
      patchStyle(
        img,
        "filter",
        isDarkTheme ? "brightness(0.8) contrast(1.05)" : "",
        "dimDarkModeImages",
      );
    });

    document.querySelectorAll("video").forEach((video) => {
      assertIsElement(video, HTMLVideoElement);
      patchStyle(
        video,
        "filter",
        isDarkTheme ? "brightness(0.8) contrast(1.05)" : "",
        "dimDarkModeImages",
      );
    });
  }

  if (!enableLayout) return;

  const processableImages = Array.from(images).filter((img) => {
    assertIsElement(img, HTMLImageElement);
    return !findInvalidContainer(img);
  });

  for (const img of processableImages) {
    if (processed.has(img)) continue;

    assertIsElement(img, HTMLImageElement);

    let p = findImagesContainer(img);

    if (!p) {
      continue;
    }

    patchStyle(p, "position", "static", "enableLayout");
    if (p.parentElement) {
      patchStyle(p.parentElement, "paddingTop", "0px", "enableLayout");
    }

    const postImages = p.querySelectorAll("img:not([draggable='false'])");
    const count = postImages.length;

    if (count > 3) {
      continue;
    }

    if (enableLayout) {
      const sizes: [number, number][] = [];

      for (const postImg of postImages) {
        assertIsElement(postImg, HTMLImageElement);

        sizes.push([postImg.naturalWidth, postImg.naturalHeight]);
      }

      const w = p.clientWidth;

      const proportions = getImageProportions(count, w, sizes);

      for (let i = 0; i < p.childElementCount; i++) {
        const child: Element = p.children[i];
        assertIsElement(child);
        patchStyle(
          child,
          "flexBasis",
          `${proportions[i] * 100}%`,
          "enableLayout",
        );
        if (count === 3 && i === 1) {
          for (const grandChild of child.children) {
            assertIsElement(grandChild);
            patchStyle(grandChild, "flexBasis", "auto", "enableLayout");
          }
        }
      }
    }

    if (enableLayout) {
      for (const postImg of postImages) {
        assertIsElement(postImg, HTMLImageElement);
        patchStyle(postImg, "position", "static", "enableLayout");
        if (postImg.parentElement) {
          if (enableLayout)
            patchStyle(
              postImg.parentElement,
              "lineHeight",
              "0px",
              "enableLayout",
            );
        }

        const cont = findAspectRatioContainer(postImg);
        if (cont) {
          patchStyle(cont, "width", "100%", "enableLayout");
          patchStyle(cont, "aspectRatio", "auto", "enableLayout");
        }

        processed.add(postImg);
      }
    }
  }
}

storage.watch<boolean>("local:enableLayout", processImages);
storage.watch<boolean>("local:dimDarkModeImages", processImages);
