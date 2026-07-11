'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
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
          signInUrl="/sign-in"
          forceRedirectUrl="/marketplace"
        />
      </div>
    </div>
  );
}
