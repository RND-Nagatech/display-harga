import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from repo root by default (because `npm --workspace server ...` runs with CWD=`server/`)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env"), override: true });

const UPLOADS_DIR = path.join(__dirname, "uploads");
const PORT = Number(process.env.PORT || 7118);
const JWT_SECRET = process.env.JWT_SECRET || "display-harga-dev-secret";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/db_display_nagagold";
const MONGODB_DB = getDbNameFromMongoUri(MONGODB_URI);

await fs.mkdir(UPLOADS_DIR, { recursive: true });

const mongoClient = new MongoClient(MONGODB_URI);
await mongoClient.connect();
const db = mongoClient.db(MONGODB_DB);

console.log(`MongoDB connected: ${redactMongoUri(MONGODB_URI)} (db=${MONGODB_DB})`);

const tmUser = db.collection("tm_user");
const tpSystem = db.collection("tp_system");
const tmKategori = db.collection("tm_kategori");
const tmMedia = db.collection("tm_media");

await tmUser.createIndex({ username: 1 }, { unique: true });
await tmKategori.createIndex({ code: 1 }, { unique: true });

await tpSystem.updateOne(
  { _id: "singleton" },
  {
    $setOnInsert: {
      companyCode: "",
      companyName: "",
      address: "",
      phone: "",
      updatedAt: new Date().toISOString()
    }
  },
  { upsert: true }
);

await ensureDefaultAdmin();

const app = express();
const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
    }
  })
});

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", async (_req, res) => {
  const ok = await db.command({ ping: 1 }).then(() => true).catch(() => false);
  res.json({
    data: {
      ok,
      mongoDb: MONGODB_DB
    }
  });
});

// ---- Auth
app.post("/api/auth/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const user = await tmUser.findOne({ username, isActive: { $ne: false } });
  if (!user) {
    return res.status(401).json({ message: "Login gagal" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Login gagal" });
  }

  const token = jwt.sign({ sub: String(user._id), level: user.level }, JWT_SECRET, { expiresIn: "7d" });
  return res.json({ data: { token, user: sanitizeUser(user) } });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await tmUser.findOne(getIdFilter(req.auth.userId));
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ data: sanitizeUser(user) });
});

// ---- Kategori (tm_kategori)
app.get("/api/categories", requireAuth, async (_req, res) => {
  const categories = await tmKategori.find({}).sort({ code: 1 }).toArray();
  res.json({ data: categories.map(sanitizeKategori) });
});

app.post("/api/categories", requireAuth, async (req, res) => {
  const code = String(req.body.code || "").trim();
  const name = String(req.body.name || "").trim();
  const price = Number(req.body.price || 0);
  const buybackPrice = Number(req.body.buybackPrice ?? req.body.hargaBuyback ?? 0);
  const isActive = req.body.isActive !== false;

  if (!code || !name) {
    return res.status(400).json({ message: "Kode kategori dan nama kategori wajib diisi" });
  }

  const now = new Date().toISOString();
  const doc = {
    code,
    name,
    price,
    buybackPrice,
    isActive,
    createdAt: now,
    updatedAt: now
  };
  try {
    await tmKategori.insertOne(doc);
  } catch (_error) {
    return res.status(409).json({ message: "Kode kategori sudah digunakan" });
  }
  return res.status(201).json({ data: sanitizeKategori(doc) });
});

app.put("/api/categories/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  const code = String(req.body.code || "").trim();
  const name = String(req.body.name || "").trim();
  const price = Number(req.body.price || 0);
  const buybackPrice = Number(req.body.buybackPrice ?? req.body.hargaBuyback ?? 0);
  const isActive = req.body.isActive !== false;

  if (!code || !name) {
    return res.status(400).json({ message: "Kode kategori dan nama kategori wajib diisi" });
  }

  const now = new Date().toISOString();
  try {
    const result = await tmKategori.findOneAndUpdate(
      getIdFilter(id),
      { $set: { code, name, price, buybackPrice, isActive, updatedAt: now } },
      { returnDocument: "after" }
    );
    const updated = result?.value ?? result;
    if (!updated) {
      return res.status(404).json({ message: "Kategori tidak ditemukan" });
    }
    return res.json({ data: sanitizeKategori(updated) });
  } catch (_error) {
    return res.status(409).json({ message: "Kode kategori sudah digunakan" });
  }
});

app.delete("/api/categories/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  await tmKategori.deleteOne(getIdFilter(id));
  res.status(204).end();
});

// ---- Media (tm_media)
app.get("/api/media", requireAuth, async (_req, res) => {
  const media = await tmMedia.find({}).sort({ createdAt: -1 }).toArray();
  res.json({ data: media.map(sanitizeMedia) });
});

app.post("/api/media/upload", requireAuth, upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File video wajib diisi" });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const now = new Date().toISOString();
  const doc = {
    label: String(req.body.label || req.file.originalname),
    type: "file",
    fileName: req.file.filename,
    url: `${baseUrl}/uploads/${req.file.filename}`,
    isActive: req.body.isActive !== false,
    createdAt: now,
    updatedAt: now
  };
  await tmMedia.insertOne(doc);
  return res.status(201).json({ data: sanitizeMedia(doc) });
});

app.post("/api/media/youtube", requireAuth, async (req, res) => {
  const sourceUrl = String(req.body.url || req.body.sourceUrl || "").trim();
  const embedUrl = toYoutubeEmbedUrl(sourceUrl);
  if (!embedUrl) {
    return res.status(400).json({ message: "Link YouTube tidak valid" });
  }

  const now = new Date().toISOString();
  const doc = {
    label: String(req.body.label || "YouTube Video"),
    type: "youtube",
    sourceUrl,
    embedUrl,
    durationSec: Number(req.body.durationSec || 30),
    isActive: req.body.isActive !== false,
    createdAt: now,
    updatedAt: now
  };
  await tmMedia.insertOne(doc);
  return res.status(201).json({ data: sanitizeMedia(doc) });
});

app.put("/api/media/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  const label = String(req.body.label || "").trim();
  const isActive = req.body.isActive !== false;
  const now = new Date().toISOString();

  const existing = await tmMedia.findOne(getIdFilter(id));
  if (!existing) {
    return res.status(404).json({ message: "Media tidak ditemukan" });
  }

  const setPayload = { label: label || existing.label, isActive, updatedAt: now };
  if (existing.type === "youtube") {
    const sourceUrl = String(req.body.sourceUrl || req.body.url || existing.sourceUrl || "").trim();
    const embedUrl = toYoutubeEmbedUrl(sourceUrl);
    if (!embedUrl) {
      return res.status(400).json({ message: "Link YouTube tidak valid" });
    }
    setPayload.sourceUrl = sourceUrl;
    setPayload.embedUrl = embedUrl;
    setPayload.durationSec = Number(req.body.durationSec || existing.durationSec || 30);
  }

  const result = await tmMedia.findOneAndUpdate(
    getIdFilter(id),
    { $set: setPayload },
    { returnDocument: "after" }
  );
  const updated = result?.value ?? result;
  if (!updated) {
    return res.status(404).json({ message: "Media tidak ditemukan" });
  }
  return res.json({ data: sanitizeMedia(updated) });
});

app.delete("/api/media/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  const selected = await tmMedia.findOne(getIdFilter(id));
  await tmMedia.deleteOne(getIdFilter(id));
  if (selected?.type === "file" && selected?.fileName) {
    const filePath = path.join(UPLOADS_DIR, selected.fileName);
    await fs.rm(filePath, { force: true }).catch(() => undefined);
  }
  res.status(204).end();
});

// ---- System setting (tp_system)
app.get("/api/system", requireAuth, async (_req, res) => {
  const system = await tpSystem.findOne({ _id: "singleton" });
  res.json({ data: sanitizeSystem(system) });
});

app.put("/api/system", requireAuth, requireAdmin, async (req, res) => {
  const payload = {
    companyCode: String(req.body.companyCode || "").trim(),
    companyName: String(req.body.companyName || "").trim(),
    address: String(req.body.address || "").trim(),
    phone: String(req.body.phone || "").trim(),
    updatedAt: new Date().toISOString()
  };
  await tpSystem.updateOne({ _id: "singleton" }, { $set: payload }, { upsert: true });
  res.json({ data: payload });
});

// ---- Users (tm_user)
app.get("/api/users", requireAuth, requireAdmin, async (_req, res) => {
  const users = await tmUser.find({}).sort({ username: 1 }).toArray();
  res.json({ data: users.map(sanitizeUser) });
});

app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const level = normalizeUserLevel(req.body.level);
  const isActive = req.body.isActive !== false;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  const doc = {
    username,
    passwordHash,
    level,
    isActive,
    createdAt: now,
    updatedAt: now
  };

  try {
    await tmUser.insertOne(doc);
  } catch (_error) {
    return res.status(409).json({ message: "Username sudah digunakan" });
  }

  res.status(201).json({ data: sanitizeUser(doc) });
});

app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id || "");
  const username = String(req.body.username || "").trim();
  const level = normalizeUserLevel(req.body.level);
  const isActive = req.body.isActive !== false;
  const now = new Date().toISOString();

  if (!username) {
    return res.status(400).json({ message: "Username wajib diisi" });
  }

  const setPayload = { username, level, isActive, updatedAt: now };
  const newPassword = String(req.body.password || "");
  if (newPassword) {
    setPayload.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  try {
    const result = await tmUser.findOneAndUpdate(
      getIdFilter(id),
      { $set: setPayload },
      { returnDocument: "after" }
    );
    const updated = result?.value ?? result;
    if (!updated) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    return res.json({ data: sanitizeUser(updated) });
  } catch (_error) {
    return res.status(409).json({ message: "Username sudah digunakan" });
  }
});

app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id || "");
  await tmUser.deleteOne(getIdFilter(id));
  res.status(204).end();
});

// ---- Player display (public)
app.get("/api/display", async (_req, res) => {
  const [categories, media, system] = await Promise.all([
    tmKategori
      .find({ isActive: { $ne: false } })
      .sort({ code: 1 })
      .toArray(),
    tmMedia.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tpSystem.findOne({ _id: "singleton" })
  ]);

  res.json({
    data: {
      categories: categories.map(sanitizeKategori),
      media: media.map(sanitizeMedia),
      system: sanitizeSystem(system)
    }
  });
});

app.listen(PORT, () => {
  console.log(`display-harga backend listening on http://localhost:${PORT}`);
});

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    username: user.username,
    level: user.level,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function sanitizeSystem(system) {
  if (!system) return null;
  return {
    companyCode: system.companyCode || "",
    companyName: system.companyName || "",
    address: system.address || "",
    phone: system.phone || "",
    updatedAt: system.updatedAt
  };
}

function sanitizeKategori(item) {
  return {
    id: String(item._id),
    code: item.code,
    name: item.name,
    price: Number(item.price || 0),
    buybackPrice: Number(item.buybackPrice ?? item.hargaBuyback ?? 0),
    isActive: item.isActive !== false
  };
}

function sanitizeMedia(item) {
  return {
    id: String(item._id),
    label: item.label,
    type: item.type,
    url: item.url,
    fileName: item.fileName,
    sourceUrl: item.sourceUrl,
    embedUrl: item.embedUrl,
    durationSec: item.durationSec,
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function normalizeUserLevel(level) {
  const raw = String(level || "").toLowerCase();
  if (raw === "admin") return "admin";
  return "operator";
}

function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: payload.sub, level: payload.level };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.level === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
}

function toYoutubeEmbedUrl(url) {
  const id = youtubeIdFromUrl(url);
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0&playsinline=1`
    : null;
}

async function ensureDefaultAdmin() {
  const count = await tmUser.countDocuments({});
  if (count > 0) return;
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash("admin123", 10);
  await tmUser.insertOne({
    username: "admin",
    passwordHash,
    level: "admin",
    isActive: true,
    createdAt: now,
    updatedAt: now
  });
  console.log("Default admin created: username=admin password=admin123");
}

function getDbNameFromMongoUri(uri) {
  const withoutScheme = uri.replace(/^mongodb\+srv:\/\//, "").replace(/^mongodb:\/\//, "");
  const pathStart = withoutScheme.indexOf("/");
  if (pathStart === -1) return "db_display_nagagold";
  const pathAndQuery = withoutScheme.slice(pathStart + 1);
  const dbName = pathAndQuery.split("?")[0];
  return dbName || "db_display_nagagold";
}

function redactMongoUri(uri) {
  return uri.replace(/\/\/([^@/]+)@/g, (_match, creds) => {
    const user = String(creds).split(":")[0];
    return `//${user}:***@`;
  });
}

function getIdFilter(id) {
  const raw = String(id || "");
  const filters = [{ _id: raw }];
  if (ObjectId.isValid(raw)) {
    filters.push({ _id: new ObjectId(raw) });
  }
  return { $or: filters };
}

function youtubeIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;
      const parts = parsed.pathname.split("/");
      const index = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (index >= 0 && parts[index + 1]) return parts[index + 1];
    }
    return null;
  } catch (_error) {
    if (/^[a-zA-Z0-9_-]{11}$/.test(String(url))) return String(url);
    return null;
  }
}
