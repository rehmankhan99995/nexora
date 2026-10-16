import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { NexoraAvatar } from "@/components/nexora-avatar";

export default function Page() {
  return <AuthShell><div className="space-y-6"><NexoraAvatar emotion="success" statusText="Your account was created. Email verification is still required." /><div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Your account was created. Please check your email to confirm it before signing in.</p>
              <Link href="/login" className="mt-4 block text-sm text-violet-300 hover:text-violet-200">Return to sign in</Link>
            </CardContent>
          </Card>
        </div></div></AuthShell>;
}
