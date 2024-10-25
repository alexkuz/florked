export default defineContentScript({
  matches: ['*://bsky.app/*'],
  runAt: "document_end",
  main() {
    const observer = new MutationObserver(() => {
      const images = document.querySelectorAll("img:not([draggable='false'])");
      const processed = new Set<Element>();
      const isDarkTheme = document.documentElement.classList.contains("theme--dim")
      || document.documentElement.classList.contains("theme--dark");

      const GAP = 4;

      if (isDarkTheme) {
        document.querySelectorAll("img").forEach(img => {
          assertIsElement(img, HTMLImageElement);
          img.style.filter = "brightness(0.8) contrast(1.2)";
        });

        document.querySelectorAll("video").forEach(video => {
          assertIsElement(video, HTMLVideoElement);
          video.style.filter = "brightness(0.8) contrast(1.2)";
        });
      }

      const processableImages = Array.from(images).filter(img => {
        assertIsElement(img, HTMLImageElement);
        return !findInvalidContainer(img);
      });

      for(const img of processableImages) {
        if (processed.has(img)) continue;

        assertIsElement(img, HTMLImageElement);

        let p = findImagesContainer(img);

        if (!p) { continue; }

        p.style.position = "static";
        if (p.parentElement) {
          p.parentElement.style.paddingTop = "0px";
        }

        const postImages = p.querySelectorAll("img:not([draggable='false'])");
        const count = postImages.length;
        const sizes: [number,number][] = [];
        const proportions: number[] = [];

        if (count > 3) { continue; }

        for (const postImg of postImages) {
          assertIsElement(postImg, HTMLImageElement);

          sizes.push([postImg.naturalWidth, postImg.naturalHeight]);
        }

        const w = p.clientWidth;

        switch(count) {
          case 1:
            proportions.push(1);
            break;

          case 2: {
            const ar0 = sizes[0][0] / sizes[0][1];
            const ar1 = sizes[1][0] / sizes[1][1];
            const prop1 = ar0 / (ar0 + ar1);
            const prop2 = 1 - prop1;
            proportions.push(prop1);
            proportions.push(prop2);              
            break;
          }

          case 3: {
            const ar0 = sizes[0][0] / sizes[0][1];
            const ar1 = sizes[1][0] / sizes[1][1];
            const ar2 = sizes[2][0] / sizes[2][1];
            const ar12 = 1 / (1 / ar1 + 1 / ar2);
            const prop1 = (ar0 + ar0 * ar12 * GAP / (w - GAP)) / (ar0 + ar12);
            const prop2 = 1 - prop1;
            proportions.push(prop1);
            proportions.push(prop2);
            break;
          }
        }

        for (let i = 0; i < p.childElementCount; i++) {
          const child: Element = p.children[i];
          assertIsElement(child);
          child.style.flexBasis = `${proportions[i] * 100}%`;
          if (count === 3 && i === 1) {
            for (const grandChild of child.children) {
              assertIsElement(grandChild);
              grandChild.style.flexBasis = "auto";
            }
          }
        }


        for (const postImg of postImages) {
          assertIsElement(postImg, HTMLImageElement);
          postImg.style.position = "static";
          if (postImg.parentElement) {
            postImg.parentElement.style.lineHeight = "0px";
          }

          const cont = findAspectRatioContainer(postImg);
          if (cont) {
            cont.style.aspectRatio = "auto";
            cont.style.width = "100%";
          }

          processed.add(postImg);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

function assertIsElement<T extends HTMLElement = HTMLElement>(el: unknown, elType?: { prototype: T, new(): T }): asserts el is T {
  if (!(el instanceof (elType ?? HTMLElement))) throw new Error(`${el} not an HTMLElement`);
}

function findInvalidContainer(el: HTMLElement) {
  let p = el.parentElement;
  while (p) {
    if (p instanceof HTMLAnchorElement) {
      return p;
    }
    if (p.getAttribute("role") === "dialog") {
      return p;
    }
    p = p.parentElement;
  }
  return null;  
}

function findImagesContainer(el: HTMLElement) {
  let p = el.parentElement;
  while (p) {
    const st = getComputedStyle(p);
    if (st.display === "flex" && st.flexDirection === "row") {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}

function findAspectRatioContainer(el: HTMLElement) {
  let p = el.parentElement;
  while (p) {
    const st = getComputedStyle(p);
    if (st.aspectRatio !== "auto") {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}
