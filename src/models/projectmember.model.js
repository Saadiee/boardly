import mongoose, { Schema } from "mongoose";

const projectMemeberSchema = new Schema({});

export const ProjectMember = mongoose.model(
  "ProjectMember",
  projectMemeberSchema,
);
