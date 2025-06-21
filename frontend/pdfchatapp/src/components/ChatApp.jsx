import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const [showPopover, setShowPopover] = useState(true);

  const userId = useRef(`u_${Math.random().toString(36).slice(2, 10)}`);
  const sessionId = useRef(`s_${Math.random().toString(36).slice(2, 10)}`);

  const baseURL =
    import.meta.env.VITE_ADK_SERVER_URL || "http://172.16.17.98:8000";
  const sessionURL = `${baseURL}/apps/pdfchat/users/${userId.current}/sessions/${sessionId.current}`;
  const runURL = `${baseURL}/run`;

  const startSession = async () => {
    try {
      const res = await axios.post(sessionURL, {
        state: { started_at: new Date().toISOString() },
      });
      setSessionStarted(true);
    } catch (error) {
      console.error("Failed to start session", error);
    }
  };

  const toggleChat = async () => {
    if (!isOpen && !sessionStarted) await startSession();
    setIsOpen(!isOpen);
    setShowPopover(false); // hide popover after first open
  };

  const sendMessage = async () => {
    if (!query.trim()) return;

    const userMsg = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const payload = {
        appName: "pdfchat",
        userId: userId.current,
        sessionId: sessionId.current,
        newMessage: {
          role: "user",
          parts: [{ text: query }],
        },
      };

      const res = await axios.post(runURL, payload);

      let botReply = "";
      const last = res.data[res.data.length - 1];
      if (last?.content?.parts?.[0]?.text) {
        botReply = last.content.parts[0].text;
      } else {
        const funcResp = res.data.find(
          (item) => item.content?.parts?.[0]?.functionResponse?.response?.result
        );
        botReply =
          funcResp?.content?.parts?.[0]?.functionResponse?.response?.result ||
          "Sorry, I couldn't understand the response.";
      }

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Could not fetch response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      {/* Floating Chat Button with Popover */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {showPopover && !isOpen && (
          <div className="mb-2 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg animate-fade-in-down text-sm">
            Need help with iPortal?
          </div>
        )}
        <div
          onClick={toggleChat}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:scale-105 transform transition duration-300 animate-pulse cursor-pointer"
          title="Chat with Assistant"
        >
          💬
        </div>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[80vh] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 border border-gray-300">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-5 py-3 font-semibold text-lg flex items-center justify-between">
            iPortal Support Assistant
            <button
              onClick={toggleChat}
              className="text-white text-xl leading-none font-bold"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="px-4 py-3 bg-gray-100 text-sm text-gray-600 italic">
            👋 Hello! How can I assist you with iPortal today?
          </div>

          <div className="flex-1 px-4 py-2 overflow-y-auto space-y-3 text-sm bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[75%] px-4 py-2 rounded-xl shadow-sm ${
                  msg.sender === "user"
                    ? "ml-auto bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 italic animate-pulse">
                Agent is typing...
              </div>
            )}
            <div ref={chatRef} />
          </div>

          <div className="flex border-t p-3 bg-gray-50">
            <input
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={query}
              placeholder="What help do you need regarding iPortal?"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition duration-300"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
