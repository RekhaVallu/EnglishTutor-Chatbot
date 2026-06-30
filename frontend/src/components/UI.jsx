import { useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { VoiceInput } from "./VoiceInput";

export const UI = ({ hidden }) => {
  const input = useRef();

  const { chat, loading, message } = useChat();

  const [inputMode, setInputMode] = useState("text");

  const sendMessage = () => {
    const text = input.current.value;

    if (!loading && text.trim()) {
      chat(text);
      input.current.value = "";
    }
  };

  const handlePrompt = (text) => {
    if (!loading) {
      chat(text);
    }
  };

  if (hidden) return null;

  return (
    <>
      <div className="fixed inset-0 z-10 pointer-events-none">

        {/* ---------------- HEADER ---------------- */}

        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">

          <h1 className="text-5xl font-black text-white drop-shadow-lg">
            🎓 FluentAI
          </h1>

          <p className="text-lg text-white mt-2">
            Practice English with your Personal AI Tutor
          </p>

          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mt-3">

            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>

            <span className="text-white text-sm font-medium">
              {loading ? "🤔 Thinking..." : "🟢 AI Tutor Online"}
            </span>

          </div>

        </div>

        {/* ---------------- WELCOME CARD ---------------- */}

        <div className="absolute left-8 top-32 w-[360px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 pointer-events-auto">

          <h2 className="text-2xl font-bold">
            👋 Hello!
          </h2>

          <p className="text-blue-600 font-semibold mt-1">
            I'm FluentAI
          </p>

          <p className="text-gray-700 leading-7 mt-4">
            Ask me grammar questions,
            improve vocabulary,
            practice pronunciation,
            or simply have a conversation in English.
          </p>

          <h3 className="font-semibold mt-6 mb-3">
            💬 Try asking
          </h3>

          <div className="flex flex-col gap-2">

            <button
              onClick={() => handlePrompt("Explain Present Perfect")}
              className="text-left bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition"
            >
              Explain Present Perfect
            </button>

            <button
              onClick={() => handlePrompt("Help me improve pronunciation")}
              className="text-left bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition"
            >
              Help me improve pronunciation
            </button>

            <button
              onClick={() => handlePrompt("Give me five new vocabulary words")}
              className="text-left bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition"
            >
              Give me 5 new vocabulary words
            </button>

            <button
              onClick={() => handlePrompt("Correct my sentence")}
              className="text-left bg-blue-50 hover:bg-blue-100 rounded-lg p-3 transition"
            >
              Correct my sentence
            </button>

          </div>

        </div>

        {/* ---------------- TRANSCRIPT ---------------- */}

        {message && (
          <div className="transcript-container pointer-events-auto">

            <div className="transcript-header">
              <h3>💬 AI Response</h3>
            </div>

            <div className="transcript-content">

              <strong>🤖 FluentAI</strong>

              <p className="mt-2 whitespace-pre-wrap">
                {message.text}
              </p>

            </div>

          </div>
        )}

        {/* ---------------- INPUT ---------------- */}

        <div className="fixed bottom-4 left-0 right-0 pointer-events-auto max-w-screen-sm w-full mx-auto">

          <div className="flex gap-2 mb-2 justify-center">

            <button
              onClick={() => setInputMode("text")}
              className={`px-4 py-2 rounded-t-lg font-medium ${
                inputMode === "text"
                  ? "bg-white text-blue-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              📝 Text
            </button>

            <button
              onClick={() => setInputMode("voice")}
              className={`px-4 py-2 rounded-t-lg font-medium ${
                inputMode === "voice"
                  ? "bg-white text-green-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              🎤 Voice
            </button>

          </div>

          <div className="bg-white rounded-xl shadow-xl p-4">
                        {inputMode === "text" ? (

              <div className="flex items-center gap-2">

                <input
                  ref={input}
                  className="w-full placeholder:text-gray-600 p-3 rounded-md border border-gray-300 focus:outline-none focus:border-blue-500"
                  placeholder="Ask anything about English..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />

                <button
                  onClick={sendMessage}
                  disabled={loading || message}
                  className={`bg-blue-600 hover:bg-blue-700 text-white p-3 px-6 font-semibold rounded-md whitespace-nowrap ${
                    loading || message
                      ? "cursor-not-allowed opacity-30"
                      : ""
                  }`}
                >
                  {loading ? "🤔 Thinking..." : "Send"}
                </button>

              </div>

            ) : (

              <VoiceInput />

            )}

          </div>

        </div>

      </div>
    </>
  );
};