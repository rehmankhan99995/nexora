import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

const allowedDestinations = new Set(["/dashboard", "/auth/verified", "/reset-password"]);

function getSafeNext(value: string | null) {
	if (!value) return "/dashboard";
	if (value.startsWith("/") && !value.startsWith("//") && allowedDestinations.has(value)) return value;
	return null;
}

function redirectToLogin(request: NextRequest) {
	return NextResponse.redirect(new URL("/auth/login?error=oauth_failed", request.url));
}

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const requestedNext = url.searchParams.get("next");
	const next = getSafeNext(requestedNext);

	if (next === null) return redirectToLogin(request);

	if (url.searchParams.has("error") || url.searchParams.has("error_code")) {
		return next === "/dashboard"
			? redirectToLogin(request)
			: NextResponse.redirect(new URL("/auth/error?error=Authentication%20was%20not%20completed", request.url));
	}

	const code = url.searchParams.get("code");
	if (!code) {
		return NextResponse.redirect(new URL("/auth/error?error=Invalid%20authentication%20callback", request.url));
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) {
		return next === "/dashboard"
			? redirectToLogin(request)
			: NextResponse.redirect(new URL("/auth/error?error=Authentication%20link%20expired", request.url));
	}

	return NextResponse.redirect(new URL(next, request.url));
}