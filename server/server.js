import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || "https://medkarimjouini.github.io").split(",").map(v => v.trim()).filter(Boolean);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin(origin, cb) { if (!origin || allowedOrigins.includes(origin)) return cb(null, true); return cb(new Error("Origine non autorisée")); }, methods: ["GET","POST"], allowedHeaders: ["Content-Type"] }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Protection anti-abus temporaire : réessaie dans une minute." } }));

const allowed = new Map([
  ["image/png","image"],["image/jpeg","image"],["image/webp","image"],["image/gif","image"],
  ["application/pdf","file"],["text/plain","file"],["text/markdown","file"],["application/json","file"],
  ["application/msword","file"],["application/vnd.openxmlformats-officedocument.wordprocessingml.document","file"],
  ["application/rtf","file"],["text/rtf","file"],["application/vnd.oasis.opendocument.text","file"],
  ["application/vnd.ms-powerpoint","file"],["application/vnd.openxmlformats-officedocument.presentationml.presentation","file"],
  ["text/csv","file"],["application/vnd.ms-excel","file"],["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","file"]
]);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 20, fields: 5, fieldSize: 15000 }, fileFilter(req,file,cb) { if (allowed.has(file.mimetype)) return cb(null,true); cb(new Error("Format de fichier non pris en charge : " + file.mimetype)); } });

app.get("/api/health", (_req,res) => res.json({ ok:true, service:"JouiniGPT API", aiConfigured:Boolean(process.env.OPENAI_API_KEY) }));
app.post("/api/chat", upload.array("files",10), async (req,res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error:"La clé API OpenAI n'est pas encore configurée sur le serveur." });
    const message = String(req.body.message || "").trim();
    if (!message && !(req.files?.length)) return res.status(400).json({ error:"Écris un message ou joins un fichier." });
    if (message.length > 12000) return res.status(400).json({ error:"Message trop long (12 000 caractères maximum)." });
    const files = req.files || [];
    const total = files.reduce((n,f)=>n+f.size,0);
    if (total > 50 * 1024 * 1024) return res.status(413).json({ error:"La taille totale des fichiers dépasse la limite technique de 50 Mo par requête de l’API." });
    let history = [];
    try { history = JSON.parse(req.body.history || "[]"); } catch { return res.status(400).json({ error:"Historique de conversation invalide." }); }
    const safeHistory = Array.isArray(history) ? history.slice(-12).filter(x=>x && ["user","assistant"].includes(x.role) && typeof x.content==="string").map(x=>({role:x.role,content:x.content.slice(0,6000)})) : [];
    const content = [];
    if (message) content.push({ type:"input_text", text:message });
    for (const file of files) {
      const data = "data:" + file.mimetype + ";base64," + file.buffer.toString("base64");
      if (allowed.get(file.mimetype)==="image") content.push({ type:"input_image", image_url:data, detail:"high" });
      else content.push({ type:"input_file", filename:file.originalname.replace(/[\\/]/g,"_").slice(0,180), file_data:data, detail:"auto" });
    }
    const client = new OpenAI({ apiKey:process.env.OPENAI_API_KEY });
    const input = [...safeHistory, { role:"user", content }];
    const webSearch = req.body.webSearch !== "false";
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-astra",
      instructions: "Tu es JouiniGPT, un assistant polyvalent, précis et utile. Réponds dans la langue de l'utilisateur. Analyse attentivement les images, captures et fichiers joints. Distingue les faits vérifiés des hypothèses, indique les incertitudes et cite les sources consultées lorsque tu utilises la recherche Web. N'invente jamais des références ou des résultats. Respecte les règles d'utilisation et les limites de sécurité applicables.",
      input,
      ...(webSearch ? { tools:[{type:"web_search"}], include:["web_search_call.action.sources"] } : {}),
      store:false
    });
    const answer = response.output_text || "Je n'ai pas pu produire de réponse textuelle.";
    const sources = [];
    for (const item of response.output || []) if (item.type==="web_search_call" && item.action?.sources) for (const s of item.action.sources) if (s.url) sources.push({title:s.title || s.url,url:s.url});
    res.json({ answer, sources:[...new Map(sources.map(s=>[s.url,s])).values()].slice(0,8), model:process.env.OPENAI_MODEL || "gpt-6-astra" });
  } catch (error) {
    console.error("JouiniGPT request failed:", error?.status || "", error?.message || error);
    if (error instanceof multer.MulterError) return res.status(413).json({error:"Fichier trop volumineux ou trop de fichiers joints. La requête est limitée par les capacités techniques de l’API."});
    const status = error?.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    res.status(status).json({ error: status===401 ? "Clé API OpenAI invalide." : status===429 ? "Limite ou crédit API atteint. Vérifie la facturation OpenAI." : "Le service IA a rencontré une erreur. Réessaie plus tard." });
  }
});
app.use((err,_req,res,_next)=>{ console.error("Upload/CORS error:",err.message); res.status(400).json({error:err.message || "Requête invalide."}); });
app.listen(PORT,()=>console.log("JouiniGPT API listening on",PORT));
