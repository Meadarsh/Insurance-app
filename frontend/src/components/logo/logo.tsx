import type { LinkProps } from '@mui/material/Link';

import { useId } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const theme = useTheme();

  const gradientId = useId();

  const TEXT_PRIMARY = theme.vars.palette.text.primary;
  const PRIMARY_LIGHT = theme.vars.palette.primary.light;
  const PRIMARY_MAIN = theme.vars.palette.primary.main;
  const PRIMARY_DARKER = theme.vars.palette.primary.dark;

  const singleLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`${gradientId}-1`}
          x1="256"
          y1="96"
          x2="256"
          y2="448"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={PRIMARY_LIGHT} />
          <stop offset="1" stopColor={PRIMARY_MAIN} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${`${gradientId}-1`})`}
        d="M256 48C194.5 48 144 98.5 144 160v48h32v-48c0-44.2 35.8-80 80-80s80 35.8 80 80v48h32v-48c0-61.5-50.5-112-112-112z"
      />
      <path
        fill={PRIMARY_MAIN}
        d="M448 160v48h-32v-48c0-88.4-71.6-160-160-160S96 71.6 96 160v48H64v-48c0-106 86-192 192-192s192 86 192 192z"
      />
      <path
        fill={PRIMARY_DARKER}
        d="M448 256c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32v-32h384v32z"
      />
      <path
        fill={PRIMARY_MAIN}
        d="M64 288v160c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V288H64z"
      />
      <text
        x="50%"
        y="380"
        textAnchor="middle"
        fontSize="120"
        fontFamily="Arial, sans-serif"
        fill="white"
        fontWeight="bold"
      >
        I
      </text>
    </svg>
  );

  const fullLogo = (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: '12px' }}
      >
        <defs>
          <linearGradient
            id={`${gradientId}-full`}
            x1="256"
            y1="96"
            x2="256"
            y2="448"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={PRIMARY_LIGHT} />
            <stop offset="1" stopColor={PRIMARY_MAIN} />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${`${gradientId}-full`})`}
          d="M256 48C194.5 48 144 98.5 144 160v48h32v-48c0-44.2 35.8-80 80-80s80 35.8 80 80v48h32v-48c0-61.5-50.5-112-112-112z"
        />
        <path
          fill={PRIMARY_MAIN}
          d="M448 160v48h-32v-48c0-88.4-71.6-160-160-160S96 71.6 96 160v48H64v-48c0-106 86-192 192-192s192 86 192 192z"
        />
        <path
          fill={PRIMARY_DARKER}
          d="M448 256c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32v-32h384v32z"
        />
        <path
          fill={PRIMARY_MAIN}
          d="M64 288v160c0 17.7 14.3 32 32 32h320c17.7 0 32-14.3 32-32V288H64z"
        />
      </svg>
      <span style={{ 
        fontSize: '24px', 
        fontWeight: 'bold',
        background: `linear-gradient(45deg, ${PRIMARY_MAIN}, ${PRIMARY_DARKER})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent',
        lineHeight: 1
      }}>
        Insurance
      </span>
    </div>
  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 102, height: 36 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
