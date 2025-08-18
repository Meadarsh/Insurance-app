import { CONFIG } from 'src/config-global';

import { OtpVerificationView } from 'src/sections/auth/otp-verification';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`OTP Verification - ${CONFIG.appName}`}</title>

      <OtpVerificationView />
    </>
  );
}
