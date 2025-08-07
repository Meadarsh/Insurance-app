import { CONFIG } from 'src/config-global';
import RewardsView from 'src/sections/rewards/view/rewards-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Rewards - ${CONFIG.appName}`}</title>
      <RewardsView />
    </>
  );
}
