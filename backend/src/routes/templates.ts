import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parsePdf, moveTmpToTemplates } from '../services/pdf-parser';
import { dbAll, dbGet, dbRun } from '../db';

const router = Router();

const TMP_DIR = path.resolve(__dirname, '../../../.tmp');
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'));
    }
  },
});

interface TemplateRow {
  id: string;
  name: string;
  filename: string;
  sections: string;
  uploaded_at: string;
  is_default: number;
}

// POST /api/templates/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const name = (req.body as { name?: string }).name || req.file.originalname.replace('.pdf', '');
  const templateId = uuidv4();
  const filename = `${templateId}.pdf`;

  try {
    const { rawText, sections } = await parsePdf(req.file.path);
    moveTmpToTemplates(req.file.path, TEMPLATES_DIR, filename);

    const isFirst = dbAll('SELECT id FROM templates').length === 0 ? 1 : 0;

    dbRun(
      'INSERT INTO templates (id, name, filename, extracted_text, sections, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [templateId, name, filename, rawText, JSON.stringify(sections), isFirst],
    );

    return res.json({
      id: templateId,
      name,
      filename,
      sectionsCount: sections.length,
      sections,
      isDefault: isFirst === 1,
    });
  } catch (err) {
    // Clean up tmp file on error
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/templates
router.get('/', (_req: Request, res: Response) => {
  const rows = dbAll<TemplateRow>(
    'SELECT id, name, filename, sections, uploaded_at, is_default FROM templates ORDER BY uploaded_at DESC',
  );
  const templates = rows.map(r => ({
    id: r.id,
    name: r.name,
    filename: r.filename,
    sections: JSON.parse(r.sections || '[]') as string[],
    uploadedAt: r.uploaded_at,
    isDefault: r.is_default === 1,
  }));
  return res.json({ templates });
});

// GET /api/templates/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = dbGet<TemplateRow>(
    'SELECT id, name, filename, sections, uploaded_at, is_default FROM templates WHERE id = ?',
    [req.params['id']!],
  );
  if (!row) return res.status(404).json({ error: 'Template not found.' });

  return res.json({
    id: row.id,
    name: row.name,
    sections: JSON.parse(row.sections || '[]') as string[],
    uploadedAt: row.uploaded_at,
    isDefault: row.is_default === 1,
  });
});

// DELETE /api/templates/:id
router.delete('/:id', (req: Request, res: Response) => {
  const row = dbGet<TemplateRow>('SELECT filename FROM templates WHERE id = ?', [req.params['id']!]);
  if (!row) return res.status(404).json({ error: 'Template not found.' });

  const filePath = path.join(TEMPLATES_DIR, row.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  dbRun('DELETE FROM templates WHERE id = ?', [req.params['id']!]);

  return res.json({ success: true });
});

// PATCH /api/templates/:id/default
router.patch('/:id/default', (req: Request, res: Response) => {
  const row = dbGet<TemplateRow>('SELECT id FROM templates WHERE id = ?', [req.params['id']!]);
  if (!row) return res.status(404).json({ error: 'Template not found.' });

  dbRun('UPDATE templates SET is_default = 0', []);
  dbRun('UPDATE templates SET is_default = 1 WHERE id = ?', [req.params['id']!]);

  return res.json({ success: true });
});

export default router;
