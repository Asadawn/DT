import type { SelectOption } from '../types/canonical.types';

export function selectOptionLabelFn(
  options: () => readonly SelectOption[],
): (value: string) => string {
  return (value: string) => options().find((option) => option.value === value)?.label ?? value;
}
