import { CONFIG } from 'src/config-global';
import CommissionView from 'src/sections/commission/view/commission-view';


// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Commission - ${CONFIG.appName}`}</title>

      <CommissionView />
    </>
  );
}