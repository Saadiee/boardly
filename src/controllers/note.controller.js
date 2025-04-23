import mongoose from "mongoose";
import ProjectNote from "../models/note.model.js";
import Project from "../models/project.model.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

const getNotes = async (req, res) => {
  // get all notes
  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json(new ApiError(400, "Invalid project ID"));
  }
  try {
    // TODO update pipeline in future to include user details
    const notes = ProjectNote.aggregate([
      {
        $match: { project: mongoose.Types.ObjectId(projectId) },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    if (notes.length === 0) {
      return res.status(404).json(new ApiError(404, "No notes found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Notes fetched successfully", notes));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

const getNoteById = async (req, res) => {
  // get note by id
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid note ID" });
  }
  try {
    const note = await ProjectNote.findById(id).populate(
      "createdBy",
      "content",
    );
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Note fetched successfully", note));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

const createNote = async (req, res) => {
  // create note
  const { createdBy, project, content } = req.body;
  const user = req.user;
  if (!createdBy || !project || !content) {
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }
  if (!mongoose.Types.ObjectId.isValid(project)) {
    return res.status(400).json(new ApiError(400, "Invalid project ID"));
  }
  if (!mongoose.Types.ObjectId.isValid(createdBy)) {
    return res.status(400).json(new ApiError(400, "Invalid user ID"));
  }
  if (typeof content !== "string" || !content.trim()) {
    return res
      .status(400)
      .json(new ApiError(400, "Content must be a non-empty string"));
  }
  try {
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json(new ApiError(404, "Project not found"));
    }

    const note = await ProjectNote.create({
      createdBy: user._id,
      project,
      content,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, "Note created successfully", note));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

const updateNote = async (req, res) => {
  // update note
  const { content } = req.body;
  const { projectId } = req.params;
  if (!content) {
    return res.status(400).json(new ApiError(400, "Content is required"));
  }
  if (typeof content !== "string" || !content.trim()) {
    return res
      .status(400)
      .json(new ApiError(400, "Content must be a non-empty string"));
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json(new ApiError(400, "Invalid project ID"));
  }
  try {
    const notes = await ProjectNote.findOneAndUpdate(
      { project: projectId },
      { $set: { content: content.trim() } },
      { new: true, runValidators: true },
    );
    if (!notes) {
      return res.status(404).json(new ApiError(404, "Note not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Note updated successfully", notes));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

const deleteNote = async (req, res) => {
  // delete note
  const { noteId } = req.params;
  const user = req.user;
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    return res.status(400).json(new ApiError(400, "Invalid note ID"));
  }
  try {
    const note = await ProjectNote.findById(noteId);
    if (!note) {
      return res.status(404).json(new ApiError(404, "Note not found"));
    }
    if (note.createdBy.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json(new ApiError(403, "You are not authorized to delete this note"));
    }
    await ProjectNote.findByIdAndDelete(noteId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Note deleted successfully"));
  } catch {
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
