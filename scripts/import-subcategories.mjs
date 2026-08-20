import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "source/subcategory-classification-manifest.json"), "utf8"));
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for subcategory import");

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await db.beginTransaction();
  for (let index = 0; index < manifest.rows.length; index += 100) {
    const chunk = manifest.rows.slice(index, index + 100);
    for (const row of chunk) {
      const [result] = await db.query(
        "UPDATE questions SET subcategory = ?, subcategoryStatus = ?, subcategoryNotes = ? WHERE questionId = ?",
        [row.subcategory, row.status, row.notes, row.questionId],
      );
      if (result.affectedRows !== 1) throw new Error(`Question not found for subcategory import: ${row.questionId}`);
    }
  }
  const settings = [
    ["subcategory_manifest", JSON.stringify({ generatedAt: manifest.generatedAt, total: manifest.total, summary: manifest.summary }), "Official-PDF-derived subcategory classification traceability"],
    ["subcategory_assigned_count", String(manifest.rows.filter(row => row.status === "assigned").length), "Questions assigned an approved primary subcategory"],
    ["subcategory_needs_manual_review_count", String(manifest.rows.filter(row => row.status === "needs_manual_review").length), "Questions intentionally retained for manual subcategory review"],
  ];
  for (const [key, value, notes] of settings) {
    await db.query("INSERT INTO settings (`key`, value, notes) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value), notes=VALUES(notes)", [key, value, notes]);
  }
  await db.commit();
  const [summary] = await db.query("SELECT subcategoryStatus AS status, subcategory, COUNT(*) AS count FROM questions GROUP BY subcategoryStatus, subcategory ORDER BY count DESC, subcategory ASC");
  console.log(JSON.stringify({ total: manifest.total, summary }, null, 2));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  db.destroy();
}
