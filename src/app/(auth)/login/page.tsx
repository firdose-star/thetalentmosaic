/**
 * `/login` — Server Component page, client island for the form.
 *
 * It lives in the `(auth)` route group (neutral shell, no sidebar) while the
 * community pages live in `(app)` (the shared shell). Route groups do not
 * appear in the URL, so each gets completely different chrome — which is
 * exactly why route groups exist.
 *
 * The page itself ships no JS. `<LoginForm />` is the only 'use client' unit,
 * because only it needs state, handlers, and a mutation.
 */
import { Suspense } from "react";

import { LoadingState } from "@/components/shared/state-views";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm, PreviewSignIn } from "@/features/auth";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Welcome to the Community</CardTitle>
        <CardDescription>
          Access is by approval. New here? Ask a member to invite you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* LoginForm reads useSearchParams (for ?next=), which must sit under a
            Suspense boundary so the route can still be statically shelled. */}
        <Suspense fallback={<LoadingState className="min-h-52" />}>
          <div className="flex flex-col gap-6">
            <PreviewSignIn />
            <LoginForm />
          </div>
        </Suspense>
      </CardContent>
    </Card>
  );
}
