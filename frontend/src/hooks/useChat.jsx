import { createContext, useContext, useEffect, useState } from "react";

const BACKEND_URL = "https://englishtutor-chatbot.onrender.com"; // Removed the trailing slash

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    setLoading(true);
    setMessage(null); // Clear current message immediately
    
    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If the backend provides a user-facing message array, display it.
        // This is for graceful error handling like API limits.
        if (responseData.messages) {
          setMessages(responseData.messages);
        } else {
          // For other errors (like our own rate limit), throw to the catch block.
          throw new Error(
            responseData.error || `Request failed with status: ${response.status}`
          );
        }
      } else {
        // Success case
        setMessages(responseData.messages);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([{
        text: `Sorry, I'm having a technical issue. The error is: ${error.message}`,
        facialExpression: "concerned",
        animation: "Idle"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const onMessagePlayed = () => {
    setMessages([]); // Clear all messages when done
    setMessage(null);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider value={{ chat, message, onMessagePlayed, loading }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};