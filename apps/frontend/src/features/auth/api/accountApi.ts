import { supabase } from "@/lib/supabaseClient";

/**
 * Delete the current user's account
 * Calls the delete-account Edge Function with service_role permissions
 */
export async function deleteAccount() {
  try {
    // Get the current session to get the access token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: new Error("No active session") };
    }

    // Get Supabase URL and anon key from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { error: new Error("Missing Supabase configuration") };
    }

    console.log("[accountApi] Calling Edge Function:", `${supabaseUrl}/functions/v1/delete-account`);
    console.log("[accountApi] Session user:", session.user.email);

    // Call the Edge Function with anon key in Authorization and user JWT in custom header
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        "x-user-token": session.access_token,
        "Content-Type": "application/json",
      },
    });

    console.log("[accountApi] Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[accountApi] Error response:", errorData);
      return { error: new Error(errorData.error || "Failed to delete account") };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error("[accountApi] Delete account error:", error);
    return { error: error as Error, data: null };
  }
}
