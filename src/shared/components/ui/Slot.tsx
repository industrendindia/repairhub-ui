import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";

type SlottableProps = {
  className?: string;
  disabled?: boolean;
};

type SlotProps = ButtonHTMLAttributes<HTMLElement> & {
  children?: ReactNode;
};

export function Slot({ children, ...props }: SlotProps) {
  if (!isValidElement(children)) {
    return null;
  }

  const child = children as ReactElement<SlottableProps>;

  return cloneElement(child, {
    ...props,
    ...child.props,
    className: [props.className, child.props.className].filter(Boolean).join(" "),
  });
}
