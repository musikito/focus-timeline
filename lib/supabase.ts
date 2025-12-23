// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// /**
//  * Server-side Supabase client
//  * - Uses service role key
//  * - NEVER import into client components
//  */
// export const supabase = createClient(
//   supabaseUrl,
//   serviceRoleKey,
//   {
//     auth: {
//       persistSession: false,
//     },
//   }
// );
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client (service role).
 * Do NOT import into client components.
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
