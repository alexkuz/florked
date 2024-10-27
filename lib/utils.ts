import { Settings } from "./settings";

const GAP = 4;

const STYLE_MAP = new Map<
  HTMLElement,
  Partial<Record<keyof Settings, Partial<CSSStyleDeclaration>>>
>();

export function patchStyle<
  T extends keyof CSSStyleDeclaration,
  K extends keyof Settings,
>(el: HTMLElement, key: T, value: CSSStyleDeclaration[T], settingKey: K) {
  const props = STYLE_MAP.get(el);
  if (props?.[settingKey]?.[key] === undefined) {
    STYLE_MAP.set(el, {
      ...props,
      [settingKey]: {
        ...props?.[settingKey],
        [key]: el.style[key] ?? "",
      },
    });
  }

  el.style[key] = value;
}

export function resetStyles<
  T extends keyof CSSStyleDeclaration,
  K extends keyof Settings,
>(settingKey: K) {
  for (const [el, props] of STYLE_MAP.entries()) {
    if (props[settingKey]) {
      for (const [key, val] of Object.entries(props[settingKey])) {
        if (val) {
          el.style[key as T] = val as CSSStyleDeclaration[T];
        } else {
          // delete el.style[key as any];
          el.style[key as T] = "" as CSSStyleDeclaration[T];
        }
      }
    }
  }
}

export function assertIsElement<T extends HTMLElement = HTMLElement>(
  el: unknown,
  elType?: { prototype: T; new (): T },
): asserts el is T {
  if (!(el instanceof (elType ?? HTMLElement)))
    throw new Error(`${el} not an HTMLElement`);
}

export function findInvalidContainer(el: HTMLElement) {
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

export function findImagesContainer(el: HTMLElement) {
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

export function findAspectRatioContainer(el: HTMLElement) {
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

export function getImageProportions(
  count: number,
  width: number,
  sizes: [number, number][],
) {
  const proportions: number[] = [];
  switch (count) {
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
      const prop1 = (ar0 + (ar0 * ar12 * GAP) / (width - GAP)) / (ar0 + ar12);
      const prop2 = 1 - prop1;
      proportions.push(prop1);
      proportions.push(prop2);
      break;
    }
  }
  return proportions;
}
