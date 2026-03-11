import MessagesWorkspace from "../../components/MessagesWorkspace";

export default function MessagesPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[#2b2b2b]">Messages</h1>
        <p className="mt-2 text-[#6b6b6b]">
          Two-way client messaging workspace designed for future Twilio integration.
        </p>
      </div>

      <MessagesWorkspace />
    </>
  );
}