import mongoose from "mongoose";
import { ProjectNote } from "../models/note.model.js";
import { Project } from "../models/project.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";

export const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const notes = await ProjectNote.find({
      project: new mongoose.Types.ObjectId(project._id),
    }).populate("createdBy", "username fullname");

    return res
      .status(200)
      .json(new ApiResponse(200, notes, "Notes fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Notes are not found!"),
      );
  }
});

export const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  try {
    const getNote = await ProjectNote.findById(noteId).populate(
      "createdBy",
      "username fullname",
    );
    if (!getNote) {
      throw new ApiError(404, "Note not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, notes, "Note fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Note not found!"));
  }
});

export const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const note = await ProjectNote.create({
      project: new mongoose.Types.ObjectId(projectId),
      content,
      createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    const populateNote = await ProjectNote.findById(note._id).populate(
      "createdBy",
      "username fullname",
    );

    return res
      .status(200)
      .json(new ApiResponse(200, populateNote, "Note created successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Note not created!"));
  }
});

export const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content } = req.body;
  console.log(noteId);

  try {
    const extstingNote = await ProjectNote.findById(noteId);
    if (!extstingNote) {
      throw new ApiError(404, "Note not found");
    }

    const updatedNote = await ProjectNote.findByIdAndUpdate(
      noteId,
      { content },
      { new: true },
    ).populate("createdBy", "username fullname");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Note not updated!"));
  }
});

export const deleNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  try {
    const deletatedNote = await ProjectNote.findByIdAndDelete(noteId);
    if (!deletatedNote) {
      throw new ApiError(404, "Note not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Note deleted successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message || "Note not deletated!"));
  }
});
