"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (username === "admin" && password === "admin") {
      setError("");
      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-[#2b2b2b]">
          Vanguardia CRM
        </h1>

        <p className="mb-6 text-center text-sm text-[#6b6b6b]">
          Sign in to access the system
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2b2b2b]">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 outline-none focus:border-[#4b0a06]"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2b2b2b]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 outline-none focus:border-[#4b0a06]"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[#4b0a06] py-2 text-white hover:bg-[#5f0d08]"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}