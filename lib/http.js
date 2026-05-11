import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function getBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : undefined;
}

export async function getSupabaseForRequest(request) {
  const supabase = createSupabaseServerClient(getBearerToken(request));

  if (!supabase) {
    return { supabase: null, user: null };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export function missingEnvResponse(names) {
  return json(
    {
      error: "Missing required environment variable(s).",
      missing: names.filter((name) => !process.env[name])
    },
    { status: 500 }
  );
}

export function normalizeError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return JSON.stringify(error);
}
