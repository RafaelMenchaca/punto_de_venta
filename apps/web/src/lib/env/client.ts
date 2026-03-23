export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  devUserId: process.env.NEXT_PUBLIC_DEV_USER_ID ?? "",
  devBusinessId: process.env.NEXT_PUBLIC_DEV_BUSINESS_ID ?? "",
  devBranchId: process.env.NEXT_PUBLIC_DEV_BRANCH_ID ?? "",
  devRegisterId: process.env.NEXT_PUBLIC_DEV_REGISTER_ID ?? "",
};
