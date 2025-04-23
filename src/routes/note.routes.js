import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.js";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
} from "../controllers/note.controller.js";

const router = Router();

router.route("/get-notes/:projectId").get(isLoggedIn, getNotes);
router.route("/get-note/:id").get(isLoggedIn, getNoteById);
router.route("/update-note/:projectId").post(isLoggedIn, updateNote);
router.route("/create-note").post(isLoggedIn, createNote);
router.route("/delete-note/:noteId").delete(isLoggedIn, deleteNote);

export default router;
