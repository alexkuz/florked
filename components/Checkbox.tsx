import * as zagSwitch from "@zag-js/switch";
import { normalizeProps, useMachine } from "@zag-js/solid";
import {
  createMemo,
  createUniqueId,
  createSignal,
  createEffect,
} from "solid-js";

type CheckboxProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: any;
};

export function Checkbox(props: CheckboxProps) {
  const [state, send] = useMachine(
    zagSwitch.machine({
      id: props.id ?? createUniqueId(),
      checked: props.checked,
      onCheckedChange: (details) => {
        props.onCheckedChange(details.checked);
      },
    }),
  );

  const api = createMemo(() => zagSwitch.connect(state, send, normalizeProps));

  createEffect(() => {
    api().setChecked(props.checked);
  });

  return (
    <label {...api().getRootProps()}>
      <input {...api().getHiddenInputProps()} />
      <span {...api().getControlProps()}>
        <span {...api().getThumbProps()} />
      </span>
      <span {...api().getLabelProps()}>{props.children}</span>
    </label>
  );
}
