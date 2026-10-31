import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'flame'
  | 'dumbbell'
  | 'clock'
  | 'chart'
  | 'plus'
  | 'chevron'
  | 'check'
  | 'play'
  | 'backup'
  | 'spark'
  | 'rest'
  | 'scale';

type IconProps = {
  name: IconName;
  color: string;
  size?: number;
};

const stroke = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
};

export function Icon({ name, color, size = 22 }: IconProps) {
  const pen = { ...stroke, stroke: color };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'flame' ? (
        <Path
          {...pen}
          d="M12 2.8c.5 2.7 2.3 4 3.3 5.8 1.1 2 1.5 3.2 1.5 4.9 0 3.1-2.3 5.7-4.8 5.7S7.2 16.6 7.2 13.5c0-1.6.6-2.9 1.4-4.1.4 1.4 1.3 2.1 2.2 1.4.2-2.3.6-4 1.2-8z"
        />
      ) : null}
      {name === 'dumbbell' ? (
        <Path {...pen} d="M3 9.5v5M5.5 7.5v9M8 9.5v5M16 9.5v5M18.5 7.5v9M21 9.5v5M8 12h8" />
      ) : null}
      {name === 'clock' ? (
        <>
          <Circle {...pen} cx="12" cy="12" r="8" />
          <Path {...pen} d="M12 8v4.5l3 2" />
        </>
      ) : null}
      {name === 'chart' ? <Path {...pen} d="M4 19h16M7 16v-5M12 16V7M17 16v-3" /> : null}
      {name === 'plus' ? <Path {...pen} d="M12 5v14M5 12h14" /> : null}
      {name === 'chevron' ? <Path {...pen} d="M9 6l6 6-6 6" /> : null}
      {name === 'check' ? <Path {...pen} d="M6 12.5l3.5 3.5L18 8" /> : null}
      {name === 'play' ? <Path d="M9 7.2v9.6l8.2-4.8L9 7.2z" fill={color} /> : null}
      {name === 'backup' ? <Path {...pen} d="M6 8.5h12v9H6zM6 12.5h12M9 5.5h6" /> : null}
      {name === 'spark' ? (
        <Path {...pen} d="M12 3.5l1.4 5.1 5.1 1.4-5.1 1.4L12 16.5l-1.4-5.1L5.5 10l5.1-1.4L12 3.5z" />
      ) : null}
      {name === 'rest' ? (
        <Path {...pen} d="M16.2 14.2A6.2 6.2 0 1 1 9.8 6.2a4.8 4.8 0 0 0 6.4 8z" />
      ) : null}
      {name === 'scale' ? (
        <>
          <Circle {...pen} cx="12" cy="12" r="7.2" />
          <Circle {...pen} cx="12" cy="12" r="2.4" />
        </>
      ) : null}
    </Svg>
  );
}
