const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ ERROR: Supabase credentials not found!");
  console.error("Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables");
  console.error("See SUPABASE_SETUP.md for instructions");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase client initialized");

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

// Load messages from Supabase on startup
async function loadMessagesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(MAX_MESSAGES);

    if (error) {
      throw error;
    }

    // Format messages for client
    const formattedMessages = (data || []).map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      date: new Date(msg.created_at).toLocaleDateString(),
      time: new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(msg.created_at).getTime(),
    }));

    console.log(`✅ Loaded ${formattedMessages.length} messages from Supabase`);
    return formattedMessages;
  } catch (error) {
    console.error("❌ Error loading messages from Supabase:", error);
    return [];
  }
}

// Store messages in memory for quick access
let messages = [];

// Load messages on startup
(async () => {
  messages = await loadMessagesFromSupabase();
})();

// HTTP Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    // Reload from Supabase to get latest
    messages = await loadMessagesFromSupabase();
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
      const senderName = msg.senderName || "Unknown";

      // Insert message into Supabase
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            text: sanitizedText,
            sender: senderName,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Format message for client
      const message = {
        id: data.id,
        text: data.text,
        sender: data.sender,
        date: new Date(data.created_at).toLocaleDateString(),
        time: new Date(data.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: new Date(data.created_at).getTime(),
      };

      // Add to in-memory cache
      messages.push(message);

      // Keep only last MAX_MESSAGES in memory
      if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
      }

      // Broadcast to all connected clients
      io.emit("receive_message", message);
      
      console.log(`📨 New message from ${senderName}: ${sanitizedText.substring(0, 50)}...`);
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

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  process.exit(0);
});

server.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${NODE_ENV}`);
  console.log(`💾 Database: Supabase`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
  
  // Load messages on startup
  messages = await loadMessagesFromSupabase();
  console.log(`📊 Loaded ${messages.length} messages from database`);
  console.log(`🌐 Public access: Enabled (no authentication)`);
});
