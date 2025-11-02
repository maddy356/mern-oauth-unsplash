import axios from "axios";
import { Router } from "express";
import ensureAuth from "../middleware/ensureAuth.js";
import Search from "../models/Search.js";

const router = Router();

/**
 * GET /api/top-searches
 * Top 5 most frequent terms across all users
 */
router.get("/top-searches", async (_req, res) => {
  try {
    const agg = await Search.aggregate([
      { $group: { _id: "$term", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const top = agg.map((x) => ({ term: x._id, count: x.count }));
    res.json({ top });
  } catch (e) {
    res.status(500).json({ error: "Failed to compute top searches" });
  }
});

/**
 * POST /api/search { term }
 * - Save { userId, term, timestamp }
 * - Call Unsplash and return images
 */
router.post("/search", ensureAuth, async (req, res) => {
  const term = (req.body?.term || "").trim();
  if (!term) return res.status(400).json({ error: "term is required" });
  try {
    await Search.create({
      userId: req.user._id,
      term,
      timestamp: new Date()
    });

    const r = await axios.get("https://api.unsplash.com/search/photos", {
      params: { query: term, per_page: 24 },
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
    });

    const images = (r.data?.results || []).map((it) => ({
      id: it.id,
      thumb: it.urls?.small,
      alt: it.alt_description || "image"
    }));

    res.json({
      message: `You searched for '${term}' -- ${images.length} results.`,
      images
    });
  } catch (e) {
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * GET /api/history
 * Return user's search history
 */
router.get("/history", ensureAuth, async (req, res) => {
  try {
    const items = await Search.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.json({
      history: items.map((i) => ({
        term: i.term,
        timestamp: i.timestamp
      }))
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to get history" });
  }
});

export default router;
