import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type FeatherIconName = ComponentProps<typeof Feather>['name'];

type Props = {
  name: FeatherIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 22, color = '#f8faf9', strokeWidth = 1.75 }: Props) {
  return <Feather name={name} size={size} color={color} strokeWidth={strokeWidth} />;
}
