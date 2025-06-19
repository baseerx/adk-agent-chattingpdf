import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  // Generate dynamic user/session IDs
  const userId = useRef(`u_${Math.random().toString(36).slice(2, 10)}`);
  const sessionId = useRef(`s_${Math.random().toString(36).slice(2, 10)}`);

  const baseURL = "http://172.16.17.251:8000";
  const sessionURL = `${baseURL}/apps/pdfchat/users/${userId.current}/sessions/${sessionId.current}`;
  const runURL = `${baseURL}/run`;

  const startSession = async () => {
    try {
      const res = await axios.post(sessionURL, {
        state: { started_at: new Date().toISOString() },
      });
      setSessionStarted(true);
      console.log("Session started:", res.status);
    } catch (error) {
      console.error("Failed to start session", error);
    }
  };

  const toggleChat = async () => {
    if (!isOpen && !sessionStarted) {
      await startSession();
    }
    setIsOpen(!isOpen);
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
          parts: [
            {
              text: query,
            },
          ],
        },
      };

      const res = await axios.post(runURL, payload);
      console.log("Response:", res.data);

    // Try to extract the bot reply from the API response
    let botReply = "";
    // Prefer the last message if it has a text part
    const last = res.data[res.data.length - 1];
    if (
      last &&
      last.content &&
      Array.isArray(last.content.parts) &&
      last.content.parts[0] &&
      typeof last.content.parts[0].text === "string"
    ) {
      botReply = last.content.parts[0].text;
    } else {
      // Fallback: try to extract from functionResponse.result
      const funcResp =
        res.data.find(
        (item) =>
          item.content &&
          Array.isArray(item.content.parts) &&
          item.content.parts[0] &&
          item.content.parts[0].functionResponse
        );
      if (
        funcResp &&
        funcResp.content.parts[0].functionResponse.response &&
        funcResp.content.parts[0].functionResponse.response.result
      ) {
        botReply = funcResp.content.parts[0].functionResponse.response.result;
      } else {
        botReply = "Sorry, I couldn't understand the response.";
      }
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
      {/* Floating Bubble Button */}
      <div
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg cursor-pointer z-50"
        title="Chat"
      >
        💬
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col overflow-hidden z-50 border border-gray-300">
          <div className="bg-blue-600 text-white px-4 py-2 font-bold">
            Thesis Chat
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white self-end ml-auto max-w-[75%]"
                    : "bg-gray-200 text-black self-start max-w-[75%]"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 italic">Agent is typing...</div>
            )}
            <div ref={chatRef} />
          </div>
          <div className="flex border-t p-2">
            <input
              className="flex-1 px-3 py-1 border rounded-lg text-sm mr-2"
              value={query}
              placeholder="Type your question..."
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
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
