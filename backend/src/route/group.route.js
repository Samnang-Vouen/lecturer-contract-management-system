import express from 'express';
import { createGroup, deleteGroup, editGroup, getGroup } from '../controller/group.controller.js';

const router = express.Router();

router.get("/", getGroup);
router.post("/", createGroup);
router.put("/:id", editGroup);
router.delete("/:id", deleteGroup);

export default router;