import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import io from "socket.io-client";

// Configuration - Change this to your server IP for mobile devices
// For web: http://localhost:3000
// For mobile: http://YOUR_LOCAL_IP:3000 (e.g., http://192.168.1.100:3000)
const SOCKET_URL =
  Platform.OS === "web"
    ? "http://localhost:3000"
    : "http://192.168.0.156:3000"; // ⚠️ CHANGE THIS TO YOUR LOCAL IP

export default function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Create unique ID
  const createId = useCallback(
    () => `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    []
  );

  // Register user
  const registerUser = async () => {
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    if (trimmedUsername.length > 30) {
      Alert.alert("Error", "Username must be 30 characters or less");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${SOCKET_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: trimmedUsername }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setCurrentUser(data.user);
      setIsRegistered(true);
      initializeSocket(data.user.id);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to connect to server");
      Alert.alert("Connection Error", err.message || "Failed to connect to server");
    } finally {
      setIsConnecting(false);
    }
  };

  // Initialize socket connection
  const initializeSocket = useCallback((sessionId) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        sessionId: sessionId,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      setError(null);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setError("Failed to connect to server. Please check your connection.");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected:", reason);
      if (reason === "io server disconnect") {
        setError("Disconnected by server. Please reconnect.");
      }
    });

    newSocket.on("error", (data) => {
      console.error("Socket error:", data);
      Alert.alert("Error", data.message || "An error occurred");
    });

    // Message events
    newSocket.on("message_history", (history) => {
      setMessages(history || []);
      setTimeout(() => scrollToBottom(), 100);
    });

    newSocket.on("receive_message", (msg) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollToBottom(), 100);
    });

    // User events
    newSocket.on("user_joined", (user) => {
      console.log("User joined:", user.username);
    });

    newSocket.on("user_left", (user) => {
      console.log("User left:", user.username);
    });

    newSocket.on("user_list", (users) => {
      console.log("Active users:", users.length);
    });

    // Typing indicator
    newSocket.on("user_typing", (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Send message
  const sendMessage = useCallback(() => {
    if (!text.trim() || !socket || !socket.connected) return;

    const message = {
      id: createId(),
      text: text.trim(),
    };

    socket.emit("send_message", message);
    setText("");

    // Stop typing indicator
    if (socket.connected) {
      socket.emit("typing", { isTyping: false });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [text, socket, createId]);

  // Handle typing
  const handleTextChange = useCallback(
    (newText) => {
      setText(newText);

      if (socket && socket.connected) {
        socket.emit("typing", { isTyping: true });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          if (socket && socket.connected) {
            socket.emit("typing", { isTyping: false });
          }
        }, 1000);
      }
    },
    [socket]
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Login screen
  if (!isRegistered) {
    return (
      <KeyboardAvoidingView
        style={styles.loginContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>💬 WhatsApp Chat</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TextInput
            style={styles.loginInput}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            maxLength={30}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={registerUser}
            editable={!isConnecting}
          />
          <TouchableOpacity
            style={[styles.loginButton, isConnecting && styles.loginButtonDisabled]}
            onPress={registerUser}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Join Chat</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.serverInfo}>
            Server: {SOCKET_URL}
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Chat screen
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatsApp Chat</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser?.username || "User"}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender === currentUser?.username ? styles.right : styles.left,
            ]}
          >
            <Text style={styles.sender}>{item.sender}</Text>
            <Text style={styles.text}>{item.text}</Text>
            <Text style={styles.time}>
              {item.date} • {item.time}
            </Text>
          </View>
        )}
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </Text>
            </View>
          ) : null
        }
      />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          maxLength={1000}
          multiline
          editable={socket?.connected}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!socket?.connected || !text.trim()) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!socket?.connected || !text.trim()}
        >
          <Text style={styles.sendTxt}>SEND</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// WhatsApp-style design
const styles = StyleSheet.create({
  // Login screen
  loginContainer: {
    flex: 1,
    backgroundColor: "#ece5dd",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#25d366",
    textAlign: "center",
    marginBottom: 30,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  loginButton: {
    backgroundColor: "#25d366",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  serverInfo: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 15,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },

  // Chat screen
  container: {
    flex: 1,
    backgroundColor: "#ece5dd",
  },
  header: {
    backgroundColor: "#075e54",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 3,
  },
  messagesList: {
    padding: 10,
  },
  bubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: "75%",
  },
  right: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
  },
  left: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  sender: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#075e54",
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    marginVertical: 2,
    color: "#000",
  },
  time: {
    fontSize: 11,
    alignSelf: "flex-end",
    color: "#666",
    marginTop: 4,
  },
  typingContainer: {
    padding: 10,
    paddingLeft: 15,
  },
  typingText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
  },
  errorBanner: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
  },
  errorBannerText: {
    color: "#d32f2f",
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: "#25d366",
    marginLeft: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    minWidth: 70,
  },
  sendBtnDisabled: {
    backgroundColor: "#ccc",
  },
  sendTxt: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
