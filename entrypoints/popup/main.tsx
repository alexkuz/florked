import { render } from "solid-js/web";
import { storage } from "wxt/storage";
import { createEffect, createSignal } from "solid-js";
import { Checkbox } from "@/components/Checkbox";
import { DEFAULT_SETTINGS } from "@/lib/settings";

import "./style.css";

function Popup() {
  const [enableLayout, setEnableLayout] = createSignal<boolean | null>(null);
  const [dimDarkModeImages, setDimDarkModeImages] = createSignal<
    boolean | null
  >(null);

  createEffect(async () => {
    setEnableLayout(
      (await storage.getItem<boolean>("local:enableLayout")) ??
        DEFAULT_SETTINGS.enableLayout,
    );
    setDimDarkModeImages(
      (await storage.getItem<boolean>("local:dimDarkModeImages")) ??
        DEFAULT_SETTINGS.dimDarkModeImages,
    );
  });

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
      <Checkbox
        id="enableLayout"
        checked={enableLayout() ?? false}
        onCheckedChange={(checked) => {
          setEnableLayout(checked);
          storage.setItem("local:enableLayout", checked);
        }}
      >
        Enable ratio-preserving layout
      </Checkbox>
      <Checkbox
        id="dimDarkModeImages"
        checked={dimDarkModeImages() ?? false}
        onCheckedChange={(checked) => {
          setDimDarkModeImages(checked);
          storage.setItem("local:dimDarkModeImages", checked);
        }}
      >
        Dim images in dark mode
      </Checkbox>
    </div>
  );
}

render(() => <Popup />, document.getElementById("app")!);
