import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { MongoClient, ObjectId } from "mongodb";
import path from "path";
import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { pipeline } from "stream/promises";
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
const tmJenisKonten = db.collection("tm_jenis_konten");
const tmKonten = db.collection("tm_konten");
const tmPromo = db.collection("tm_promo");
const tmShowcase = db.collection("tm_showcase");
const tmEdukasi = db.collection("tm_edukasi");
const tmTips = db.collection("tm_tips");
const tmTestimoni = db.collection("tm_testimoni");
const tmInsight = db.collection("tm_insight");
const tmSimulasi = db.collection("tm_simulasi");
const tmInfoBuyback = db.collection("tm_info_buyback");

await tmUser.createIndex({ username: 1 }, { unique: true });
await tmKategori.createIndex({ code: 1 }, { unique: true });
await tmJenisKonten.createIndex({ jenis_konten: 1 }, { unique: true });

await tpSystem.updateOne(
  { _id: "singleton" },
  {
    $setOnInsert: {
      companyCode: "",
      companyName: "",
      address: "",
      phone: "",
      operationalDays: "",
      operationalHours: "",
      displayRefreshMinutes: 5,
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

app.post("/api/uploads", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File wajib diisi" });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(201).json({
    data: {
      fileName: req.file.filename,
      url: `${baseUrl}/uploads/${req.file.filename}`
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

// ---- Jenis Konten (tm_jenis_konten)
app.get("/api/content-types", requireAuth, async (_req, res) => {
  const items = await tmJenisKonten.find({}).sort({ jenis_konten: 1 }).toArray();
  res.json({ data: items.map(sanitizeJenisKonten) });
});

app.post("/api/content-types", requireAuth, async (req, res) => {
  const jenisKonten = String(req.body.jenis_konten || req.body.jenisKonten || "").trim();
  if (!jenisKonten) {
    return res.status(400).json({ message: "Jenis konten wajib diisi" });
  }

  const now = new Date().toISOString();
  const doc = { jenis_konten: jenisKonten, createdAt: now, updatedAt: now };
  try {
    await tmJenisKonten.insertOne(doc);
  } catch (_error) {
    return res.status(409).json({ message: "Jenis konten sudah digunakan" });
  }
  res.status(201).json({ data: sanitizeJenisKonten(doc) });
});

app.put("/api/content-types/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  const jenisKonten = String(req.body.jenis_konten || req.body.jenisKonten || "").trim();
  if (!jenisKonten) {
    return res.status(400).json({ message: "Jenis konten wajib diisi" });
  }

  try {
    const result = await tmJenisKonten.findOneAndUpdate(
      getIdFilter(id),
      { $set: { jenis_konten: jenisKonten, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    const updated = result?.value ?? result;
    if (!updated) {
      return res.status(404).json({ message: "Jenis konten tidak ditemukan" });
    }
    res.json({ data: sanitizeJenisKonten(updated) });
  } catch (_error) {
    return res.status(409).json({ message: "Jenis konten sudah digunakan" });
  }
});

app.delete("/api/content-types/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  await tmJenisKonten.deleteOne(getIdFilter(id));
  res.status(204).end();
});

// ---- Konten (tm_konten)
app.get("/api/contents", requireAuth, async (_req, res) => {
  const contents = await tmKonten.find({}).sort({ createdAt: -1 }).toArray();
  res.json({ data: contents.map(sanitizeKonten) });
});

app.post("/api/contents", requireAuth, async (req, res) => {
  const payload = normalizeKontenPayload(req.body);
  if (!payload.judul_konten || !payload.jenis_konten || !payload.source_url) {
    return res.status(400).json({ message: "Judul, jenis konten, dan source URL wajib diisi" });
  }

  const now = new Date().toISOString();
  const doc = { ...payload, isActive: req.body.isActive !== false, createdAt: now, updatedAt: now };
  await tmKonten.insertOne(doc);
  res.status(201).json({ data: sanitizeKonten(doc) });
});

app.put("/api/contents/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  const payload = normalizeKontenPayload(req.body);
  if (!payload.judul_konten || !payload.jenis_konten || !payload.source_url) {
    return res.status(400).json({ message: "Judul, jenis konten, dan source URL wajib diisi" });
  }

  const result = await tmKonten.findOneAndUpdate(
    getIdFilter(id),
    { $set: { ...payload, isActive: req.body.isActive !== false, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  const updated = result?.value ?? result;
  if (!updated) {
    return res.status(404).json({ message: "Konten tidak ditemukan" });
  }
  res.json({ data: sanitizeKonten(updated) });
});

app.delete("/api/contents/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  await tmKonten.deleteOne(getIdFilter(id));
  res.status(204).end();
});

// ---- Promo (tm_promo)
app.get("/api/promos", requireAuth, async (_req, res) => {
  const promos = await tmPromo.find({}).sort({ createdAt: -1 }).toArray();
  res.json({ data: promos.map(sanitizePromo) });
});

app.post("/api/promos", requireAuth, async (req, res) => {
  let payload;
  try {
    payload = await normalizePromoPayload(req.body, req);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Gagal memproses media promo" });
  }
  if (!payload.judul_promo) {
    return res.status(400).json({ message: "Judul promo wajib diisi" });
  }
  if (payload.media_type === "text" && !payload.deskripsi_promo) {
    return res.status(400).json({ message: "Deskripsi promo wajib diisi untuk tipe TEXT" });
  }
  if (payload.media_type !== "text" && !payload.media_opsional) {
    return res.status(400).json({ message: "Media promo wajib diisi" });
  }

  const now = new Date().toISOString();
  const doc = { ...payload, isActive: req.body.isActive !== false, createdAt: now, updatedAt: now };
  await tmPromo.insertOne(doc);
  res.status(201).json({ data: sanitizePromo(doc) });
});

app.put("/api/promos/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  const existing = await tmPromo.findOne(getIdFilter(id));
  if (!existing) {
    return res.status(404).json({ message: "Promo tidak ditemukan" });
  }
  let payload;
  try {
    payload = await normalizePromoPayload(req.body, req, existing);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Gagal memproses media promo" });
  }
  if (!payload.judul_promo) {
    return res.status(400).json({ message: "Judul promo wajib diisi" });
  }
  if (payload.media_type === "text" && !payload.deskripsi_promo) {
    return res.status(400).json({ message: "Deskripsi promo wajib diisi untuk tipe TEXT" });
  }
  if (payload.media_type !== "text" && !payload.media_opsional) {
    return res.status(400).json({ message: "Media promo wajib diisi" });
  }

  const result = await tmPromo.findOneAndUpdate(
    getIdFilter(id),
    { $set: { ...payload, isActive: req.body.isActive !== false, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  const updated = result?.value ?? result;
  if (!updated) {
    return res.status(404).json({ message: "Promo tidak ditemukan" });
  }
  res.json({ data: sanitizePromo(updated) });
});

app.delete("/api/promos/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id || "");
  await tmPromo.deleteOne(getIdFilter(id));
  res.status(204).end();
});

registerDisplayMasterRoutes({
  path: "showcases",
  collection: tmShowcase,
  titleField: "nama_produk",
  optionalField: "kategori_produk",
  optionalAliases: ["kategoriProduk"],
  requiredMessage: "Nama produk wajib diisi",
  displayOrigin: "showcase"
});

registerDisplayMasterRoutes({
  path: "edukasi",
  collection: tmEdukasi,
  titleField: "judul_edukasi",
  optionalField: "isi_edukasi",
  optionalAliases: ["isiEdukasi"],
  requiredMessage: "Judul edukasi wajib diisi",
  displayOrigin: "edukasi"
});

registerDisplayMasterRoutes({
  path: "tips",
  collection: tmTips,
  titleField: "judul_tips",
  optionalField: "isi_tips",
  optionalAliases: ["isiTips"],
  requiredMessage: "Judul tips wajib diisi",
  displayOrigin: "tips"
});

registerDisplayMasterRoutes({
  path: "testimoni",
  collection: tmTestimoni,
  titleField: "nama_pelanggan",
  optionalField: "isi_testimoni",
  optionalAliases: ["isiTestimoni"],
  requiredMessage: "Nama pelanggan wajib diisi",
  displayOrigin: "testimoni"
});

registerDisplayMasterRoutes({
  path: "insight",
  collection: tmInsight,
  titleField: "judul_insight",
  optionalField: "isi_insight",
  optionalAliases: ["isiInsight"],
  requiredMessage: "Judul insight wajib diisi",
  displayOrigin: "insight"
});

registerDisplayMasterRoutes({
  path: "simulasi",
  collection: tmSimulasi,
  titleField: "judul_simulasi",
  optionalField: "deskripsi_simulasi",
  optionalAliases: ["deskripsiSimulasi"],
  requiredMessage: "Judul simulasi wajib diisi",
  displayOrigin: "simulasi"
});

registerDisplayMasterRoutes({
  path: "info-buyback",
  collection: tmInfoBuyback,
  titleField: "judul_info",
  optionalField: "isi_info",
  optionalAliases: ["isiInfo"],
  requiredMessage: "Judul info wajib diisi",
  displayOrigin: "info_buyback"
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
    operationalDays: String(req.body.operationalDays || "").trim(),
    operationalHours: String(req.body.operationalHours || "").trim(),
    displayRefreshMinutes: normalizeRefreshMinutes(req.body.displayRefreshMinutes),
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
  const [categories, contents, promos, showcases, edukasi, tips, testimoni, insight, simulasi, infoBuyback, legacyMedia, system] = await Promise.all([
    tmKategori
      .find({ isActive: { $ne: false } })
      .sort({ code: 1 })
      .toArray(),
    tmKonten.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmPromo.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmShowcase.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmEdukasi.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmTips.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmTestimoni.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmInsight.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmSimulasi.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmInfoBuyback.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tmMedia.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).toArray(),
    tpSystem.findOne({ _id: "singleton" })
  ]);

  const media = [
    ...promos.map(promoToDisplayMedia),
    ...showcases.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.showcase)),
    ...edukasi.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.edukasi)),
    ...tips.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.tips)),
    ...testimoni.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.testimoni)),
    ...insight.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.insight)),
    ...simulasi.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.simulasi)),
    ...infoBuyback.map((item) => genericToDisplayMedia(item, DISPLAY_MASTER_CONFIG.infoBuyback)),
    ...contents.map(kontenToDisplayMedia),
    ...legacyMedia.map(sanitizeMedia)
  ];

  res.json({
    data: {
      categories: categories.map(sanitizeKategori),
      contents: contents.map(sanitizeKonten),
      promos: promos.map(sanitizePromo),
      showcases: showcases.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.showcase)),
      edukasi: edukasi.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.edukasi)),
      tips: tips.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.tips)),
      testimoni: testimoni.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.testimoni)),
      insight: insight.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.insight)),
      simulasi: simulasi.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.simulasi)),
      infoBuyback: infoBuyback.map((item) => sanitizeGenericDisplayItem(item, DISPLAY_MASTER_CONFIG.infoBuyback)),
      media,
      system: sanitizeSystem(system)
    }
  });
});

app.listen(PORT, () => {
  console.log(`display-harga backend listening on http://localhost:${PORT}`);
});

const DISPLAY_MASTER_CONFIG = {
  showcase: {
    titleField: "nama_produk",
    optionalField: "kategori_produk",
    displayOrigin: "showcase"
  },
  edukasi: {
    titleField: "judul_edukasi",
    optionalField: "isi_edukasi",
    displayOrigin: "edukasi"
  },
  tips: {
    titleField: "judul_tips",
    optionalField: "isi_tips",
    displayOrigin: "tips"
  },
  testimoni: {
    titleField: "nama_pelanggan",
    optionalField: "isi_testimoni",
    displayOrigin: "testimoni"
  },
  insight: {
    titleField: "judul_insight",
    optionalField: "isi_insight",
    displayOrigin: "insight"
  },
  simulasi: {
    titleField: "judul_simulasi",
    optionalField: "deskripsi_simulasi",
    displayOrigin: "simulasi"
  },
  infoBuyback: {
    titleField: "judul_info",
    optionalField: "isi_info",
    displayOrigin: "info_buyback"
  }
};

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
    operationalDays: system.operationalDays || "",
    operationalHours: system.operationalHours || "",
    displayRefreshMinutes: normalizeRefreshMinutes(system.displayRefreshMinutes),
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

function sanitizeJenisKonten(item) {
  return {
    id: String(item._id),
    jenis_konten: item.jenis_konten || "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function sanitizeKonten(item) {
  const sourceUrl = item.source_url || "";
  return {
    id: String(item._id),
    judul_konten: item.judul_konten || "",
    jenis_konten: item.jenis_konten || "",
    source_url: sourceUrl,
    deskripsi: item.deskripsi || "",
    durasi_tampil: Number.isFinite(Number(item.durasi_tampil)) && Number(item.durasi_tampil) > 0
      ? Number(item.durasi_tampil)
      : null,
    source_type: detectSourceType(sourceUrl),
    display_url: normalizeDisplayUrl(sourceUrl),
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function sanitizePromo(item) {
  const sourceUrl = item.display_url || item.media_resolved_url || item.media_opsional || item.banner_opsional || "";
  const sourceType = item.source_type || detectSourceType(sourceUrl, item.media_type);
  return {
    id: String(item._id),
    judul_promo: item.judul_promo || "",
    deskripsi_promo: item.deskripsi_promo || "",
    banner_opsional: item.banner_opsional || "",
    media_opsional: item.media_opsional || "",
    media_type: item.media_type || normalizeMediaType("", sourceUrl),
    media_source_mode: item.media_source_mode || "attach_link",
    media_link_source: item.media_link_source || "",
    media_resolved_url: item.media_resolved_url || "",
    text_style: normalizeTextStyle(item.text_style),
    source_type: sourceType,
    display_url: item.display_url || normalizeDisplayUrl(sourceUrl, sourceType),
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function sanitizeGenericDisplayItem(item, config) {
  const sourceUrl = item.display_url || item.media_resolved_url || item.media_opsional || "";
  const sourceType = item.source_type || detectSourceType(sourceUrl, item.media_type);
  return {
    id: String(item._id),
    [config.titleField]: item[config.titleField] || "",
    [config.optionalField]: item[config.optionalField] || "",
    media_opsional: item.media_opsional || "",
    media_type: item.media_type || normalizeMediaType("", sourceUrl),
    media_source_mode: item.media_source_mode || "attach_link",
    media_link_source: item.media_link_source || "",
    media_resolved_url: item.media_resolved_url || "",
    text_style: normalizeTextStyle(item.text_style),
    source_type: sourceType,
    display_url: item.display_url || normalizeDisplayUrl(sourceUrl, sourceType),
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function sanitizeMedia(item) {
  const sourceUrl = item.sourceUrl || item.url || "";
  return {
    id: String(item._id),
    label: item.label,
    type: item.type,
    url: item.url,
    fileName: item.fileName,
    sourceUrl: item.sourceUrl,
    embedUrl: item.embedUrl,
    durationSec: item.durationSec,
    sourceType: item.sourceType || detectSourceType(sourceUrl),
    displayUrl: item.displayUrl || item.embedUrl || normalizeDisplayUrl(sourceUrl),
    description: item.description || "",
    origin: item.origin || "media",
    isActive: item.isActive !== false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function kontenToDisplayMedia(item) {
  const sanitized = sanitizeKonten(item);
  return {
    id: `content-${sanitized.id}`,
    label: sanitized.judul_konten,
    type: sanitized.source_type,
    sourceType: sanitized.source_type,
    sourceUrl: sanitized.source_url,
    url: sanitized.display_url,
    displayUrl: sanitized.display_url,
    embedUrl: sanitized.source_type === "youtube" ? toYoutubeEmbedUrl(sanitized.source_url) : sanitized.display_url,
    durationSec: getDisplayDurationSec(sanitized.source_type, sanitized.durasi_tampil),
    description: sanitized.deskripsi,
    origin: "content",
    isActive: sanitized.isActive,
    createdAt: sanitized.createdAt,
    updatedAt: sanitized.updatedAt
  };
}

function promoToDisplayMedia(item) {
  const sanitized = sanitizePromo(item);
  const sourceUrl = sanitized.display_url || sanitized.media_resolved_url || sanitized.media_opsional || sanitized.banner_opsional;
  const isText = sanitized.source_type === "text";
  return {
    id: `promo-${sanitized.id}`,
    label: sanitized.judul_promo,
    type: isText ? "text" : sanitized.source_type || "promo",
    sourceType: sanitized.source_type,
    sourceUrl,
    url: sanitized.display_url,
    displayUrl: sanitized.display_url,
    embedUrl: sanitized.source_type === "youtube" ? toYoutubeEmbedUrl(sanitized.media_opsional || sanitized.banner_opsional) : sanitized.display_url,
    durationSec: getDisplayDurationSec(sanitized.source_type, null),
    description: sanitized.deskripsi_promo,
    textStyle: sanitized.text_style,
    origin: "promo",
    isActive: sanitized.isActive,
    createdAt: sanitized.createdAt,
    updatedAt: sanitized.updatedAt
  };
}

function genericToDisplayMedia(item, config) {
  const sanitized = sanitizeGenericDisplayItem(item, config);
  const sourceUrl = sanitized.display_url || sanitized.media_resolved_url || sanitized.media_opsional;
  const isText = sanitized.source_type === "text";
  return {
    id: `${config.displayOrigin}-${sanitized.id}`,
    label: sanitized[config.titleField],
    type: isText ? "text" : sanitized.source_type || "embed",
    sourceType: sanitized.source_type,
    sourceUrl,
    url: sanitized.display_url,
    displayUrl: sanitized.display_url,
    embedUrl: sanitized.source_type === "youtube" ? toYoutubeEmbedUrl(sanitized.media_opsional) : sanitized.display_url,
    durationSec: getDisplayDurationSec(sanitized.source_type, null),
    description: sanitized[config.optionalField],
    textStyle: sanitized.text_style,
    origin: config.displayOrigin,
    isActive: sanitized.isActive,
    createdAt: sanitized.createdAt,
    updatedAt: sanitized.updatedAt
  };
}

function normalizeKontenPayload(body) {
  return {
    judul_konten: String(body.judul_konten || body.judulKonten || "").trim(),
    jenis_konten: String(body.jenis_konten || body.jenisKonten || "").trim(),
    source_url: String(body.source_url || body.sourceUrl || "").trim(),
    deskripsi: String(body.deskripsi || "").trim(),
    durasi_tampil: Number.isFinite(Number(body.durasi_tampil || body.durasiTampil)) && Number(body.durasi_tampil || body.durasiTampil) > 0
      ? Number(body.durasi_tampil || body.durasiTampil)
      : null
  };
}

function registerDisplayMasterRoutes(config) {
  app.get(`/api/${config.path}`, requireAuth, async (_req, res) => {
    const rows = await config.collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ data: rows.map((item) => sanitizeGenericDisplayItem(item, config)) });
  });

  app.post(`/api/${config.path}`, requireAuth, async (req, res) => {
    let payload;
    try {
      payload = await normalizeGenericDisplayPayload(req.body, req, config);
    } catch (error) {
      return res.status(400).json({ message: error.message || "Gagal memproses media" });
    }

    if (!payload[config.titleField]) {
      return res.status(400).json({ message: config.requiredMessage });
    }
    if (payload.media_type === "text" && !payload[config.optionalField]) {
      return res.status(400).json({ message: `${config.optionalLabel || "Isi/deskripsi"} wajib diisi untuk tipe TEXT` });
    }
    if (payload.media_type !== "text" && !payload.media_opsional) {
      return res.status(400).json({ message: "Media wajib diisi" });
    }

    const now = new Date().toISOString();
    const doc = { ...payload, isActive: req.body.isActive !== false, createdAt: now, updatedAt: now };
    await config.collection.insertOne(doc);
    res.status(201).json({ data: sanitizeGenericDisplayItem(doc, config) });
  });

  app.put(`/api/${config.path}/:id`, requireAuth, async (req, res) => {
    const id = String(req.params.id || "");
    const existing = await config.collection.findOne(getIdFilter(id));
    if (!existing) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }
    let payload;
    try {
      payload = await normalizeGenericDisplayPayload(req.body, req, config, existing);
    } catch (error) {
      return res.status(400).json({ message: error.message || "Gagal memproses media" });
    }

    if (!payload[config.titleField]) {
      return res.status(400).json({ message: config.requiredMessage });
    }
    if (payload.media_type === "text" && !payload[config.optionalField]) {
      return res.status(400).json({ message: `${config.optionalLabel || "Isi/deskripsi"} wajib diisi untuk tipe TEXT` });
    }
    if (payload.media_type !== "text" && !payload.media_opsional) {
      return res.status(400).json({ message: "Media wajib diisi" });
    }

    const result = await config.collection.findOneAndUpdate(
      getIdFilter(id),
      { $set: { ...payload, isActive: req.body.isActive !== false, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    const updated = result?.value ?? result;
    if (!updated) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }
    res.json({ data: sanitizeGenericDisplayItem(updated, config) });
  });

  app.delete(`/api/${config.path}/:id`, requireAuth, async (req, res) => {
    const id = String(req.params.id || "");
    await config.collection.deleteOne(getIdFilter(id));
    res.status(204).end();
  });
}

async function normalizeGenericDisplayPayload(body, req, config, existing = null) {
  const titleValue = String(body[config.titleField] || body.title || existing?.[config.titleField] || "").trim();
  const optionalValue = String(
    body[config.optionalField] ||
    config.optionalAliases?.map((alias) => body[alias]).find(Boolean) ||
    existing?.[config.optionalField] ||
    ""
  ).trim();
  const mediaPayload = await normalizeSharedMediaPayload(body, req, existing);

  return {
    [config.titleField]: titleValue,
    [config.optionalField]: optionalValue,
    ...mediaPayload
  };
}

async function normalizePromoPayload(body, req, existing = null) {
  const mediaPayload = await normalizeSharedMediaPayload(body, req, existing);
  return {
    judul_promo: String(body.judul_promo || body.judulPromo || existing?.judul_promo || "").trim(),
    deskripsi_promo: String(body.deskripsi_promo || body.deskripsiPromo || existing?.deskripsi_promo || "").trim(),
    banner_opsional: "",
    ...mediaPayload
  };
}

async function normalizeSharedMediaPayload(body, req, existing = null) {
  const hasMediaUrl = body.media_opsional !== undefined || body.mediaOpsional !== undefined || body.media_url !== undefined;
  const hasMediaType = body.media_type !== undefined || body.mediaType !== undefined;
  const hasSourceMode = body.media_source_mode !== undefined || body.mediaSourceMode !== undefined;
  const hasLinkSource = body.media_link_source !== undefined || body.mediaLinkSource !== undefined;
  const hasTextStyle = body.text_style !== undefined || body.textStyle !== undefined;

  const mediaUrl = String(hasMediaUrl ? (body.media_opsional || body.mediaOpsional || body.media_url || "") : (existing?.media_opsional || "")).trim();
  const mediaType = normalizeMediaType(hasMediaType ? (body.media_type || body.mediaType) : existing?.media_type, mediaUrl);
  if (mediaType === "text") {
    return {
      media_opsional: "",
      media_type: "text",
      media_source_mode: "attach_link",
      media_link_source: "",
      media_resolved_url: "",
      text_style: normalizeTextStyle(hasTextStyle ? (body.text_style || body.textStyle) : existing?.text_style),
      source_type: "text",
      display_url: ""
    };
  }
  const mediaSourceMode = normalizeMediaSourceMode(hasSourceMode ? (body.media_source_mode || body.mediaSourceMode) : existing?.media_source_mode);
  const mediaLinkSource = normalizeMediaLinkSource(hasLinkSource ? (body.media_link_source || body.mediaLinkSource) : existing?.media_link_source, mediaUrl);
  const isGoogleDriveVideo = mediaType === "video" && mediaLinkSource === "google_drive" && googleDriveIdFromUrl(mediaUrl);
  const shouldRefreshResolved =
    isGoogleDriveVideo &&
    (
      !existing ||
      mediaUrl !== String(existing.media_opsional || "").trim() ||
      mediaType !== existing.media_type ||
      mediaLinkSource !== String(existing.media_link_source || "").trim()
    );
  const resolvedUrl = isGoogleDriveVideo
    ? (shouldRefreshResolved ? await downloadGoogleDriveVideo(mediaUrl, req) : String(existing?.media_resolved_url || ""))
    : "";
  const displaySource = resolvedUrl || mediaUrl;
  const sourceType = detectSourceType(displaySource, mediaType);

  return {
    media_opsional: mediaUrl,
    media_type: mediaType,
    media_source_mode: mediaSourceMode,
    media_link_source: mediaLinkSource,
    media_resolved_url: resolvedUrl,
    text_style: normalizeTextStyle(hasTextStyle ? (body.text_style || body.textStyle) : existing?.text_style),
    source_type: sourceType,
    display_url: normalizeDisplayUrl(displaySource, sourceType)
  };
}

function normalizeMediaType(value, url = "") {
  const raw = String(value || "").toLowerCase();
  if (raw === "text" || raw === "teks") return "text";
  if (raw === "image" || raw === "gambar") return "image";
  if (raw === "video") return "video";

  const detected = detectSourceType(url);
  if (detected === "image") return "image";
  return "video";
}

function normalizeTextStyle(value) {
  const raw = String(value || "").toLowerCase();
  if (raw === "light" || raw === "emerald" || raw === "midnight") return raw;
  return "gold";
}

function normalizeMediaSourceMode(value) {
  return String(value || "").toLowerCase() === "upload_file" ? "upload_file" : "attach_link";
}

function normalizeMediaLinkSource(value, url = "") {
  const raw = String(value || "").toLowerCase();
  if (raw === "youtube" || raw === "firebase" || raw === "google_drive") return raw;
  if (youtubeIdFromUrl(url)) return "youtube";
  if (googleDriveIdFromUrl(url)) return "google_drive";
  if (/firebase|firebasestorage\.googleapis\.com/i.test(url)) return "firebase";
  return "";
}

function normalizeRefreshMinutes(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 5;
  }

  return Math.max(1, Math.min(1440, Math.round(numericValue)));
}

function getDisplayDurationSec(sourceType, durationSec) {
  if (Number.isFinite(Number(durationSec)) && Number(durationSec) > 0) {
    return Number(durationSec);
  }

  return sourceType === "image" || sourceType === "embed" || sourceType === "youtube" || sourceType === "text" ? 10 : null;
}

function normalizeUserLevel(level) {
  const raw = String(level || "").toLowerCase();
  if (raw === "owner") return "owner";
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
  if (req.auth?.level === "owner" || req.auth?.level === "admin") {
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

function detectSourceType(url, mediaType = "") {
  if (mediaType === "text") return "text";
  const raw = String(url || "").trim();
  if (!raw) return "url";
  if (youtubeIdFromUrl(raw)) return "youtube";

  const cleanUrl = raw.split("?")[0].toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl)) return "video";
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleanUrl)) return "image";
  if (/firebasestorage\.googleapis\.com/i.test(raw)) {
    if (mediaType === "image" || mediaType === "video") return mediaType;
  }
  if (/drive\.google\.com|docs\.google\.com/i.test(raw)) return "embed";
  if (/instagram\.com|firebase/i.test(raw)) return mediaType === "image" || mediaType === "video" ? mediaType : "embed";
  if (mediaType === "image" || mediaType === "video") return mediaType;
  return "embed";
}

function normalizeDisplayUrl(url, sourceType = "") {
  const raw = String(url || "").trim();
  if (!raw) return "";
  const youtubeEmbed = toYoutubeEmbedUrl(raw);
  if (youtubeEmbed) return youtubeEmbed;
  if (sourceType === "image" || sourceType === "video") return raw;

  const driveId = googleDriveIdFromUrl(raw);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  return raw;
}

function googleDriveIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com")) return "";
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch?.[1]) return fileMatch[1];
    return parsed.searchParams.get("id") || "";
  } catch (_error) {
    return "";
  }
}

async function downloadGoogleDriveVideo(url, req) {
  const id = googleDriveIdFromUrl(url);
  if (!id) return "";

  const targetUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
  let response = await fetch(targetUrl, { redirect: "follow" });
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    const html = await response.text();
    const confirmMatch = html.match(/confirm=([0-9A-Za-z_]+)/);
    if (confirmMatch?.[1]) {
      response = await fetch(`${targetUrl}&confirm=${confirmMatch[1]}`, { redirect: "follow" });
    } else {
      throw new Error("Video Google Drive tidak dapat didownload. Pastikan link valid dan file public.");
    }
  }

  if (!response.ok || !response.body) {
    throw new Error("Gagal download video Google Drive");
  }

  const contentDisposition = response.headers.get("content-disposition") || "";
  const contentTypeFinal = response.headers.get("content-type") || "";
  const extension = getDownloadedFileExtension(contentDisposition, contentTypeFinal);
  const fileName = `${Date.now()}-google-drive-${id}${extension}`;
  const targetPath = path.join(UPLOADS_DIR, fileName);

  await pipeline(response.body, createWriteStream(targetPath));

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${fileName}`;
}

function getDownloadedFileExtension(contentDisposition, contentType) {
  const fileNameMatch = String(contentDisposition || "").match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  if (fileNameMatch?.[1]) {
    const decodedName = decodeURIComponent(fileNameMatch[1].replace(/"/g, ""));
    const ext = path.extname(decodedName);
    if (ext) return ext;
  }

  if (/webm/i.test(contentType)) return ".webm";
  if (/quicktime/i.test(contentType)) return ".mov";
  if (/ogg/i.test(contentType)) return ".ogg";
  return ".mp4";
}

async function ensureDefaultAdmin() {
  const count = await tmUser.countDocuments({});
  if (count > 0) return;
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash("b3r4sput1h", 10);
  await tmUser.insertOne({
    username: "rnd",
    passwordHash,
    level: "admin",
    isActive: true,
    createdAt: now,
    updatedAt: now
  });
  console.log("Default admin created: username=rnd password=b3r4sput1h");
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
