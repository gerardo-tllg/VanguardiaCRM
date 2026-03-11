import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
      <div className="rounded-xl border border-[#e5e5e5] bg-white p-10 text-center shadow-sm">
        <h1 className="text-4xl font-bold text-[#2b2b2b] mb-4">
          Vanguardia CRM
        </h1>

        <p className="text-[#6b6b6b] mb-8">
          Internal case management system for Vanguardia Law.
        </p>

        <Link
          href="/login"
          className="inline-block rounded-md bg-[#4b0a06] px-6 py-3 text-sm font-medium text-white hover:bg-[#5f0d08]"
        >
          Log In
        </Link>
      </div>
    </main>
  );
}