import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import MessagesWorkspace from "../../components/MessagesWorkspace";

export default function MessagesPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-[#2b2b2b]">Messages</h1>
            <p className="mt-2 text-[#6b6b6b]">
              Two-way client messaging workspace designed for future Twilio integration.
            </p>
          </div>

          <MessagesWorkspace />
        </div>
      </div>
    </main>
  );
}