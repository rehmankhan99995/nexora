import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Invitation = {
  id: string;
  email: string;
  role: "admin" | "member";
  expires_at: string;
  accepted_at: string | null;
  workspace: { business_name: string } | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);

    const body = await request.json() as { token?: string };
    if (!body.token) return json({ error: "Invitation token is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authorization } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ error: "Authentication required" }, 401);

    const { data: invitation, error: invitationError } = await supabase
      .from("workspace_invitations")
      .select("id, email, role, expires_at, accepted_at, workspace:workspaces(business_name)")
      .eq("token", body.token)
      .maybeSingle<Invitation>();

    if (invitationError || !invitation) return json({ error: "Invitation not found" }, 404);
    if (invitation.accepted_at || new Date(invitation.expires_at) <= new Date()) {
      return json({ error: "Invitation is expired or already accepted" }, 400);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("EMAIL_FROM");
    if (!resendKey || !from) return json({ error: "Email provider is not configured" }, 503);

    const inviteUrl = `${Deno.env.get("PUBLIC_SITE_URL") ?? "http://localhost:3000"}/workspace/invitations/accept?token=${body.token}`;
    const workspaceName = escapeHtml(invitation.workspace?.business_name ?? "a NEXORA workspace");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [invitation.email],
        subject: `You have been invited to ${workspaceName}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Join ${workspaceName} on NEXORA</h2><p>You have been invited as a <strong>${invitation.role}</strong>.</p><p><a href="${inviteUrl}">Accept workspace invitation</a></p><p>This invitation expires in 7 days.</p></div>`,
      }),
    });

    if (!response.ok) return json({ error: "Email provider rejected the message" }, 502);
    return json({ success: true }, 200);
  } catch (error) {
    console.error("Invitation email function failed", error);
    return json({ error: "Unexpected invitation email error" }, 500);
  }
});

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}
