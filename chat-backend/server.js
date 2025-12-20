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

// Admin secret code (10 digit alphanumeric) - HARDCODED
const ADMIN_CODE = "ADMIN12345"; // Hardcoded admin code

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

    // Get report counts
    const { data: reports } = await supabase
      .from("reported_messages")
      .select("message_id");

    const reportCounts = {};
    if (reports) {
      reports.forEach(r => {
        reportCounts[r.message_id] = (reportCounts[r.message_id] || 0) + 1;
      });
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
      reportCount: reportCounts[msg.id] || 0,
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
        text: msg.text || "",
        sender: msg.sender,
        image: msg.image || null,
        image_type: msg.image_type || null,
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

// Admin page route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
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

// Get all messages (database + in-memory)
app.get("/api/messages", async (req, res) => {
  try {
    const { search, sender, limit = 1000, includeMemory = "true" } = req.query;
    
    // Get messages from database
    let query = supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (search) {
      query = query.ilike("text", `%${search}%`);
    }
    if (sender) {
      query = query.eq("sender", sender);
    }
    const { data: dbMessages, error } = await query.limit(parseInt(limit));
    if (error) throw error;

    // Get report counts for all messages
    const { data: reports } = await supabase
      .from("reported_messages")
      .select("message_id");

    const reportCounts = {};
    if (reports) {
      reports.forEach(r => {
        reportCounts[r.message_id] = (reportCounts[r.message_id] || 0) + 1;
      });
    }

    // Format database messages
    const formattedDb = (dbMessages || []).map((msg) => ({
      id: msg.id,
      text: msg.text || "",
      sender: msg.sender,
      date: new Date(msg.created_at).toLocaleDateString(),
      time: new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: new Date(msg.created_at).getTime(),
      edited: !!msg.edited_at,
      deleted: !!msg.is_deleted,
      saved: true, // From database
      reportCount: reportCounts[msg.id] || 0,
      image: msg.image || null,
      imageType: msg.image_type || null,
    }));

    // Include in-memory messages if requested
    let allMessages = [...formattedDb];
    if (includeMemory === "true") {
      // Add in-memory messages (not yet saved)
      const memoryMessages = messages
        .filter(msg => {
          // Filter out messages that are already in database
          return !formattedDb.find(dbMsg => dbMsg.id === msg.id);
        })
        .map(msg => ({
          ...msg,
          saved: false, // Not yet saved to database
          reportCount: reportCounts[msg.id] || 0,
        }));
      allMessages = [...memoryMessages, ...allMessages];
    }

    // Sort by timestamp (newest first)
    allMessages.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ messages: allMessages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Delete message endpoint (admin only) - handles both database and memory
app.delete("/api/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if message is in memory (unsaved)
    const messageIndex = messages.findIndex(m => m.id === id);
    const isInMemory = messageIndex !== -1;
    
    // Check if message is in batch queue
    const batchIndex = messageBatch.findIndex(m => m.tempId === id);
    const isInBatch = batchIndex !== -1;

    // Remove from memory
    if (isInMemory) {
      messages.splice(messageIndex, 1);
      console.log(`🗑️ Deleted message from memory: ${id}`);
    }

    // Remove from batch queue
    if (isInBatch) {
      messageBatch.splice(batchIndex, 1);
      console.log(`🗑️ Removed message from batch queue: ${id}`);
    }

    // Try to delete from database (if it exists there)
    // Check if it's a UUID (database ID) or temp ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is ok
        console.error("Error deleting from database:", error);
      } else {
        console.log(`🗑️ Deleted message from database: ${id}`);
      }
    }

    // Broadcast deletion to all clients
    io.emit("message_deleted", { messageId: id });

    res.json({ success: true, deletedFrom: isInMemory ? "memory" : "database" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Get all reports endpoint (admin)
app.get("/api/reports", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reported_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ reports: data || [] });
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({ error: "Failed to get reports" });
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

  // Send report counts for all messages
  (async () => {
    try {
      const { data: reports } = await supabase
        .from("reported_messages")
        .select("message_id");

      const reportCounts = {};
      if (reports) {
        reports.forEach(r => {
          reportCounts[r.message_id] = (reportCounts[r.message_id] || 0) + 1;
        });
      }

      // Send report counts for each message
      Object.entries(reportCounts).forEach(([messageId, count]) => {
        socket.emit("message_reports_count", {
          messageId,
          count,
        });
      });
    } catch (error) {
      console.error("Error loading report counts:", error);
    }
  })();

  // Handle typing indicator
  socket.on("typing", (data) => {
    const userName = socket.userName || socketUserName;
    if (data.isTyping) {
      typingUsers.set(socket.id, {
        userName: userName,
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
      // Must have either text or image
      const hasText = msg.text && typeof msg.text === "string" && msg.text.trim().length > 0;
      const hasImage = msg.image && typeof msg.image === "string";
      
      if (!hasText && !hasImage) {
        socket.emit("error", { message: "Message cannot be empty" });
        return;
      }

      const sanitizedText = (msg.text || "").trim();
      
      // Check for admin code (10 digit alphanumeric) - only if no image
      if (sanitizedText === ADMIN_CODE && !hasImage) {
        socket.emit("admin_access_granted", { 
          success: true,
          message: "Admin access granted. Redirecting..." 
        });
        console.log(`🔐 Admin access granted to: ${msg.senderName || "Unknown"}`);
        return; // Don't send the code as a message
      }

      // Sanitize message (remove excessive whitespace, limit length)
      const finalText = sanitizedText.substring(0, 2000); // Max 2000 chars
      const senderName = msg.senderName || "Unknown";
      const now = new Date();

      // Generate temporary ID (will be replaced when saved to database)
      const tempId = msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      // Format message for client (sent immediately in real-time)
      const message = {
        id: tempId,
        text: finalText,
        sender: senderName,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: now.getTime(),
      };

      // Add image if present
      if (hasImage) {
        message.image = msg.image;
        message.imageType = msg.imageType || "image/jpeg";
      }

      // Add to batch for periodic saving (every 4 min 58 sec)
      const batchMessage = {
        text: finalText,
        sender: senderName,
        tempId: tempId,
        timestamp: now,
      };
      
      if (hasImage) {
        batchMessage.image = msg.image;
        batchMessage.image_type = msg.imageType || "image/jpeg";
      }
      
      messageBatch.push(batchMessage);

      // Add to in-memory cache
      messages.push(message);

      // Keep only last MAX_MESSAGES in memory
      if (messages.length > MAX_MESSAGES) {
        messages = messages.slice(-MAX_MESSAGES);
      }

      // Broadcast to all connected clients immediately (real-time)
      io.emit("receive_message", message);
      
      console.log(`📨 New message from ${senderName}: ${finalText.substring(0, 50)}... (queued for batch save)`);
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


  // Handle message report
  socket.on("report_message", async (data) => {
    try {
      const { messageId, reason, reportedBy } = data;
      if (!messageId || !reportedBy) return;

      // Check if already reported by this user
      const { data: existing } = await supabase
        .from("reported_messages")
        .select("*")
        .eq("message_id", messageId)
        .eq("reported_by", reportedBy)
        .single();

      if (existing) {
        socket.emit("message_reported", { success: false, message: "You already reported this message" });
        return;
      }

      // Insert report
      const { error } = await supabase.from("reported_messages").insert([
        {
          message_id: messageId,
          reported_by: reportedBy,
          reason: reason || "Inappropriate content",
        },
      ]);

      if (error) throw error;

      // Get report count for this message
      const { count } = await supabase
        .from("reported_messages")
        .select("*", { count: "exact", head: true })
        .eq("message_id", messageId);

      // Broadcast report count to all clients
      io.emit("message_reports_count", {
        messageId,
        count: count || 0,
      });

      socket.emit("message_reported", { success: true });
      console.log(`🚫 Message ${messageId} reported by ${reportedBy} (Total reports: ${count})`);
    } catch (error) {
      console.error("Error reporting message:", error);
      socket.emit("message_reported", { success: false, message: "Failed to report message" });
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
  console.log(`🔐 Admin code: ${ADMIN_CODE} (hardcoded)`);
  
  // Load messages on startup
  messages = await loadMessagesFromSupabase();
  console.log(`📊 Loaded ${messages.length} messages from database`);
  console.log(`🌐 Public access: Enabled (no authentication)`);
});
