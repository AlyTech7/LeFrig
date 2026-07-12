'use client';

import { SignUp } from '@clerk/nextjs';
import { clerkRedirectUrl } from '@/lib/site-url';
import { isClerkEnabled } from '@/lib/clerk';

export default function SignUpPage() {
  if (!isClerkEnabled) {
    return (
      <div className="sv-auth">
        <div className="sv-auth__notice">
          <h1>Configura Clerk</h1>
          <p>
            Añade <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> y <code>CLERK_SECRET_KEY</code> en tu
            archivo <code>.env</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sv-auth">
      <div className="sv-auth__card">
        <SignUp
          appearance={{
            elements: {
              rootBox: { width: '100%', maxWidth: 420 },
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl={clerkRedirectUrl('/sign-in')}
          forceRedirectUrl={clerkRedirectUrl('/marketplace')}
        />
      </div>
    </div>
  );
}
