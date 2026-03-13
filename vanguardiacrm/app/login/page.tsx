import GoogleSignInButton from "@/app/components/GoogleSignInButton";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-6">
      <div className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-10 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-[#2b2b2b]">
          Vanguardia CRM
        </h1>

        <p className="mt-3 text-center text-sm text-[#6b6b6b]">
          Sign in with your Google account to access the CRM.
        </p>

        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </div>
    </main>
  );
}
