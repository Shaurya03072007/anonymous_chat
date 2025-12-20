const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const rateLimit = require("express-rate-limit");

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

// Rate limiting - 10 messages per minute per IP
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: "Too many messages. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Batch messages for periodic saving
let messageBatch = [];
const BATCH_SAVE_INTERVAL = 4 * 60 * 1000 + 58 * 1000; // 4 minutes 58 seconds in milliseconds

// Save batch to Supabase
async function saveBatchToSupabase() {
  if (messageBatch.length === 0) {
    return;
  }

  try {
    const batchToSave = [...messageBatch];
    messageBatch = []; // Clear batch

    const { data, error } = await supabase
      .from("messages")
      .insert(batchToSave.map(msg => ({
        text: msg.text,
        sender: msg.sender,
      })));

    if (error) {
      throw error;
    }

    console.log(`💾 Saved ${batchToSave.length} messages to Supabase`);
  } catch (error) {
    console.error("❌ Error saving batch to Supabase:", error);
    // Re-add messages to batch if save failed
    messageBatch = [...messageBatch, ...batchToSave];
  }
}

// Auto-save batch every 4 minutes 58 seconds
setInterval(async () => {
  await saveBatchToSupabase();
}, BATCH_SAVE_INTERVAL);

// Load messages on startup
(async () => {
  messages = await loadMessagesFromSupabase();
})();

// HTTP Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: "connected",
    messagesInMemory: messages.length,
    activeUsers: activeUsers,
    batchQueue: messageBatch.length,
    timestamp: new Date().toISOString(),
  });
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    const { search, sender, limit = 100 } = req.query;
    let query = supabase.from("messages").select("*").order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("text", `%${search}%`);
    }
    if (sender) {
      query = query.eq("sender", sender);
    }

    const { data, error } = await query.limit(parseInt(limit));

    if (error) throw error;

    const formatted = (data || []).map((msg) => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      date: new Date(msg.created_at).toLocaleDateString(),
      time: new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(msg.created_at).getTime(),
      edited: !!msg.edited_at,
      deleted: !!msg.is_deleted,
    }));

    res.json({ messages: formatted.reverse() });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Search messages endpoint
app.get("/api/messages/search", messageLimiter, async (req, res) => {
  try {
    const { q, sender, startDate, endDate } = req.query;
    let query = supabase.from("messages").select("*");

    if (q) {
      query = query.ilike("text", `%${q}%`);
    }
    if (sender) {
      query = query.eq("sender", sender);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

    if (error) throw error;

    res.json({ results: data || [] });
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ error: "Failed to search messages" });
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

// Track typing users
const typingUsers = new Map(); // socketId -> { userName, timeout }

// Function to broadcast active user count
function broadcastActiveUsers() {
  io.emit("active_users", activeUsers);
}

// Function to broadcast typing indicators
function broadcastTyping() {
  const typingList = Array.from(typingUsers.values()).map((u) => u.userName);
  io.emit("typing_users", typingList);
}

io.on("connection", (socket) => {
  activeUsers++;
  const socketUserName = socket.handshake.auth?.userName || "Unknown";
  console.log(`✅ User connected: ${socket.id} (${socketUserName}) - Total: ${activeUsers}`);

  // Send active user count to all clients
  broadcastActiveUsers();

  // Send message history on connect
  socket.emit("message_history", messages);

  // Handle typing indicator
  socket.on("typing", (data) => {
    if (data.isTyping) {
      typingUsers.set(socket.id, {
        userName: socketUserName,
        timeout: setTimeout(() => {
          typingUsers.delete(socket.id);
          broadcastTyping();
        }, 3000),
      });
    } else {
      const typing = typingUsers.get(socket.id);
      if (typing) {
        clearTimeout(typing.timeout);
        typingUsers.delete(socket.id);
      }
    }
    broadcastTyping();
  });

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
      const now = new Date();

      // Generate temporary ID (will be replaced when saved to database)
      const tempId = msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      // Format message for client (sent immediately in real-time)
      const message = {
        id: tempId,
        text: sanitizedText,
        sender: senderName,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: now.getTime(),
      };

      // Add to batch for periodic saving (every 4 min 58 sec)
      messageBatch.push({
        text: sanitizedText,
        sender: senderName,
        tempId: tempId,
        timestamp: now,
      });

      // Add to in-memory cache
      messages.push(message);

      // Keep only last MAX_MESSAGES in memory
      if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
      }

      // Broadcast to all connected clients immediately (real-time)
      io.emit("receive_message", message);
      
      console.log(`📨 New message from ${senderName}: ${sanitizedText.substring(0, 50)}... (queued for batch save)`);
    } catch (error) {
      console.error("Error handling message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle message reaction
  socket.on("add_reaction", async (data) => {
    try {
      const { messageId, emoji, userName } = data;
      if (!messageId || !emoji || !userName) return;

      // Check if reaction already exists
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId)
        .eq("user_name", userName)
        .eq("emoji", emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existing.id);
      } else {
        // Add reaction
        await supabase.from("message_reactions").insert([
          {
            message_id: messageId,
            user_name: userName,
            emoji: emoji,
          },
        ]);
      }

      // Get all reactions for this message
      const { data: reactions } = await supabase
        .from("message_reactions")
        .select("*")
        .eq("message_id", messageId);

      // Broadcast updated reactions
      io.emit("message_reactions", {
        messageId,
        reactions: reactions || [],
      });
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  });

  // Handle message edit
  socket.on("edit_message", async (data) => {
    try {
      const { messageId, newText, userName } = data;
      if (!messageId || !newText || !userName) return;

      // Find message in memory
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];
      if (message.sender !== userName) {
        socket.emit("error", { message: "You can only edit your own messages" });
        return;
      }

      // Check if within 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (message.timestamp < fiveMinutesAgo) {
        socket.emit("error", { message: "Messages can only be edited within 5 minutes" });
        return;
      }

      // Update message
      const sanitizedText = newText.trim().substring(0, 2000);
      messages[messageIndex].text = sanitizedText;
      messages[messageIndex].edited = true;
      messages[messageIndex].editedAt = new Date().toISOString();

      // Update in Supabase (if message is saved)
      if (messageId.includes("-")) {
        // Temporary ID, will update when batch saves
      } else {
        await supabase
          .from("messages")
          .update({
            text: sanitizedText,
            edited_at: new Date().toISOString(),
            original_text: message.text,
          })
          .eq("id", messageId);
      }

      // Broadcast updated message
      io.emit("message_edited", {
        messageId,
        text: sanitizedText,
        edited: true,
      });
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  // Handle message delete
  socket.on("delete_message", async (data) => {
    try {
      const { messageId, userName } = data;
      if (!messageId || !userName) return;

      // Find message in memory
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];
      if (message.sender !== userName) {
        socket.emit("error", { message: "You can only delete your own messages" });
        return;
      }

      // Mark as deleted
      messages[messageIndex].deleted = true;
      messages[messageIndex].text = "[Message deleted]";

      // Update in Supabase
      if (!messageId.includes("-")) {
        await supabase
          .from("messages")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq("id", messageId);
      }

      // Broadcast deleted message
      io.emit("message_deleted", { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  // Handle message report
  socket.on("report_message", async (data) => {
    try {
      const { messageId, reason, reportedBy } = data;
      if (!messageId || !reportedBy) return;

      await supabase.from("reported_messages").insert([
        {
          message_id: messageId,
          reported_by: reportedBy,
          reason: reason || "Inappropriate content",
        },
      ]);

      socket.emit("message_reported", { success: true });
    } catch (error) {
      console.error("Error reporting message:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    activeUsers = Math.max(0, activeUsers - 1);
    
    // Clean up typing indicator
    const typing = typingUsers.get(socket.id);
    if (typing) {
      clearTimeout(typing.timeout);
      typingUsers.delete(socket.id);
      broadcastTyping();
    }

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

// Graceful shutdown - save any pending messages
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, saving pending messages...");
  await saveBatchToSupabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, saving pending messages...");
  await saveBatchToSupabase();
  process.exit(0);
});

server.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${NODE_ENV}`);
  console.log(`💾 Database: Supabase`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log(`⏰ Batch save interval: Every 4 minutes 58 seconds`);
  
  // Load messages on startup
  messages = await loadMessagesFromSupabase();
  console.log(`📊 Loaded ${messages.length} messages from database`);
  console.log(`🌐 Public access: Enabled (no authentication)`);
});
