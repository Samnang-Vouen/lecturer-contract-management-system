import fs from 'fs';
import multer from 'multer';
import path from 'path';

const advisorSignatureStorage = multer.diskStorage({
  destination(req, file, cb) {
    const outDir = path.join(process.cwd(), 'uploads', 'signatures');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    cb(null, outDir);
  },
  filename(req, file, cb) {
    const id = parseInt(req.params.id, 10);
    const who = String(req.body.who || 'advisor').toLowerCase();
    const ext = path.extname(file.originalname || '') || '.png';
    cb(null, `advisor_contract_${id}_${who}_${Date.now()}${ext}`);
  },
});

export const uploadAdvisorSignature = multer({ storage: advisorSignatureStorage });