"use client";

import { useMemo, useState } from "react";

type Conversation = {
  id: string;
  caseId?: string;
  clientName: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  body: string;
  sentAt: string;
  status: "pending" | "sent" | "delivered" | "failed" | "received";
  senderName: string;
};

const initialConversations: Conversation[] = [
  {
    id: "conv_001",
    caseId: "case0001",
    clientName: "Reyna Vazquez",
    phone: "(956) 325-3075",
    lastMessage: "Thank you, I will send the records today.",
    lastMessageAt: "10:42 AM",
    unreadCount: 1,
  },
  {
    id: "conv_002",
    caseId: "case0002",
    clientName: "Carlos Cortez",
    phone: "(956) 684-7014",
    lastMessage: "We are still at the apartment and have photos.",
    lastMessageAt: "Yesterday",
    unreadCount: 0,
  },
];

const initialMessages: Message[] = [
  {
    id: "msg_001",
    conversationId: "conv_001",
    direction: "outbound",
    body: "Good morning, just checking in on your treatment status.",
    sentAt: "9:14 AM",
    status: "delivered",
    senderName: "Vanguardia Law",
  },
  {
    id: "msg_002",
    conversationId: "conv_001",
    direction: "inbound",
    body: "Thank you, I will send the records today.",
    sentAt: "10:42 AM",
    status: "received",
    senderName: "Reyna Vazquez",
  },
  {
    id: "msg_003",
    conversationId: "conv_002",
    direction: "inbound",
    body: "We are still at the apartment and have photos.",
    sentAt: "Yesterday",
    status: "received",
    senderName: "Carlos Cortez",
  },
];

function statusLabel(status: Message["status"]) {
  switch (status) {
    case "delivered":
      return "Delivered";
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    case "received":
      return "Received";
    default:
      return status;
  }
}

export default function MessagesWorkspace() {
  const [conversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [selectedConversationId, setSelectedConversationId] = useState("conv_001");
  const [draft, setDraft] = useState("");

  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) ?? conversations[0];

  const thread = useMemo(() => {
    return messages.filter((m) => m.conversationId === selectedConversationId);
  }, [messages, selectedConversationId]);

  function handleSend() {
    const body = draft.trim();
    if (!body) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConversationId,
      direction: "outbound",
      body,
      sentAt: "Just now",
      status: "pending",
      senderName: "Vanguardia Law",
    };

    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-3 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="border-b border-[#e5e5e5] px-4 py-3">
          <h2 className="text-lg font-semibold text-[#2b2b2b]">Conversations</h2>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {conversations.map((conversation) => {
            const active = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                className={[
                  "w-full border-b border-[#eeeeee] px-4 py-4 text-left transition",
                  active ? "bg-[#fcf8f7]" : "bg-white hover:bg-[#fcfaf9]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#2b2b2b]">
                      {conversation.clientName}
                    </div>
                    <div className="mt-1 text-xs text-[#6b6b6b]">
                      {conversation.phone}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#8a8a8a]">
                      {conversation.lastMessageAt}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="mt-2 inline-flex min-w-5 justify-center rounded-full bg-[#4b0a06] px-2 py-0.5 text-xs text-white">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-sm text-[#555555] line-clamp-2">
                  {conversation.lastMessage}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="col-span-9 rounded-xl border border-[#e5e5e5] bg-white overflow-hidden flex flex-col">
        <div className="border-b border-[#e5e5e5] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#2b2b2b]">
                {selectedConversation?.clientName}
              </h2>
              <p className="mt-1 text-sm text-[#6b6b6b]">
                {selectedConversation?.phone}{" "}
                {selectedConversation?.caseId ? `· ${selectedConversation.caseId}` : ""}
              </p>
            </div>

            <div className="rounded-full border border-[#e4c9c4] bg-[#fdf6f5] px-4 py-2 text-sm text-[#4b0a06]">
              Twilio-ready messaging
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafafa] p-5 min-h-105">
          {thread.map((message) => {
            const outbound = message.direction === "outbound";

            return (
              <div
                key={message.id}
                className={`flex ${outbound ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                    outbound
                      ? "bg-[#4b0a06] text-white"
                      : "bg-white border border-[#e5e5e5] text-[#2b2b2b]",
                  ].join(" ")}
                >
                  <div className="text-sm leading-6">{message.body}</div>
                  <div
                    className={[
                      "mt-2 text-xs",
                      outbound ? "text-white/80" : "text-[#8a8a8a]",
                    ].join(" ")}
                  >
                    {message.sentAt} · {statusLabel(message.status)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#e5e5e5] bg-white p-4">
          <div className="flex gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message to the client..."
              rows={3}
              className="flex-1 resize-none rounded-md border border-[#d9d9d9] bg-white px-4 py-3 text-sm text-[#2b2b2b] placeholder:text-[#8a8a8a] outline-none focus:border-[#4b0a06]"
            />

            <button
              onClick={handleSend}
              className="self-end rounded-md bg-[#4b0a06] px-5 py-3 text-sm font-medium text-white hover:bg-[#5f0d08]"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}