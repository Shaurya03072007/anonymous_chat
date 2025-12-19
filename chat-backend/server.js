const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Message storage file
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const MAX_MESSAGES = 10000; // Keep last 10,000 messages

// Middleware
app.use(cors({
  origin: true, // Allow all origins for public access
  credentials: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Initialize messages storage
let messages = [];

// Load messages from file
async function loadMessages() {
  try {
    const data = await fs.readFile(MESSAGES_FILE, "utf8");
    messages = JSON.parse(data);
    console.log(`✅ Loaded ${messages.length} messages from storage`);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, start with empty array
      messages = [];
      await saveMessages();
      console.log("✅ Created new messages storage file");
    } else {
      console.error("Error loading messages:", error);
      messages = [];
    }
  }
}

// Save messages to file
async function saveMessages() {
  try {
    // Keep only last MAX_MESSAGES
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving messages:", error);
  }
}

// Auto-save messages every 30 seconds
setInterval(async () => {
  await saveMessages();
}, 30000);

// Load messages on startup
loadMessages();

// HTTP Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    res.json({ messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Socket.io setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins
    methods: ["GET", "POST"],
    credentials: false,
  },
});

// Track active users
let activeUsers = 0;

// Function to broadcast active user count
function broadcastActiveUsers() {
  io.emit("active_users", activeUsers);
}

io.on("connection", (socket) => {
  activeUsers++;
  console.log(`✅ User connected: ${socket.id} (Total: ${activeUsers})`);

  // Send active user count to all clients
  broadcastActiveUsers();

  // Send message history on connect
  socket.emit("message_history", messages);

  // Handle sending messages
  socket.on("send_message", async (msg) => {
    try {
      if (!msg || typeof msg.text !== "string" || msg.text.trim().length === 0) {
        socket.emit("error", { message: "Message cannot be empty" });
        return;
      }

      // Sanitize message (remove excessive whitespace, limit length)
      const sanitizedText = msg.text.trim().substring(0, 2000); // Max 2000 chars

      const message = {
        id: msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        text: sanitizedText,
        sender: msg.senderName || "Unknown", // Use sender name from client
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
      };

      // Add to messages array
      messages.push(message);

      // Keep only last MAX_MESSAGES
      if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
      }

      // Save to file (async, don't wait)
      saveMessages().catch(err => console.error("Error auto-saving:", err));

      // Broadcast to all connected clients
      io.emit("receive_message", message);
      
      console.log(`📨 New message: ${sanitizedText.substring(0, 50)}...`);
    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    activeUsers = Math.max(0, activeUsers - 1);
    console.log(`❌ User disconnected: ${socket.id} (Total: ${activeUsers})`);
    broadcastActiveUsers();
  });
});

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Graceful shutdown - save messages before exit
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, saving messages...");
  await saveMessages();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, saving messages...");
  await saveMessages();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${NODE_ENV}`);
  console.log(`💾 Message storage: File-based (${MESSAGES_FILE})`);
  console.log(`📊 Current messages: ${messages.length}`);
  console.log(`🌐 Public access: Enabled (no authentication)`);
});
