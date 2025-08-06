import { CONFIG } from 'src/config-global';
import { PoliciesView } from 'src/sections/policies/view';


// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Products - ${CONFIG.appName}`}</title>

      <PoliciesView />
    </>
  );
}
