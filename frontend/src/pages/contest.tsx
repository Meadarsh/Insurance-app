import { CONFIG } from 'src/config-global';

// components
import ContestView from 'src/sections/contest/view/contest-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Contests - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="Participate in exciting contests and win amazing prizes"
      />
      <meta name="keywords" content="contest, competition, win, prizes, insurance" />

      <ContestView />
    </>
  );
}
