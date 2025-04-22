import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { ProjectNote } from "../models/note.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";

// * DONE
const getProjects = async (req, res) => {
  const userID = new mongoose.Types.ObjectId(req.user._id);

  try {
    const result = await Project.aggregate([
      { $match: { createdBy: userID } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdBy: 1,
        },
      },
    ]);

    return res.status(200).json(new ApiResponse(200, result, "Projects found"));
  } catch (err) {
    console.error("Aggregation Error:", err);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to get projects"));
  }
};

// * DONE
const getProjectById = async (req, res) => {
  // get project by id
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json(new ApiError(400, "Project ID is required"));
  }
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json(new ApiError(404, "Project doesnot exits || Wrong project ID"));
    }
    return res.status(200).json(new ApiResponse(200, project, "Project Found"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Server error while fetching project", error));
  }
};

// * DONE
const createProject = async (req, res) => {
  const { name, description } = req.body;
  const createdBy = req.user._id;
  console.log(createdBy);
  if (!name || !description) {
    return res
      .status(400)
      .json(new ApiError(400, "Name and description are required"));
  }
  const existingProject = await Project.findOne({ name, createdBy });
  if (existingProject) {
    return res
      .status(400)
      .json(new ApiError(400, `Project with ${name} alreay exits`));
  }
  const project = await Project.create({ name, description, createdBy });
  return res.status(201).json({
    message: "Project created successfully",
    project,
  });
};

// * DONE
const updateProject = async (req, res) => {
  const { name, description, projectId } = req.body;

  if (!projectId) {
    return res.status(400).json(new ApiError(400, "Project ID is required"));
  }
  try {
    const project = await Project.findById(projectId);
    // Check if user has permission
    if (project.createdBy.toString() !== req.user._id) {
      const member = await ProjectMember.findOne({
        project: projectId,
        user: req.user._id,
        role: { $in: [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN] },
      });
      if (!member) {
        return res
          .status(403)
          .json(new ApiError(403, "Not authorized to update project"));
      }
    }
    if (!project) {
      return res
        .status(404)
        .json(new ApiError(404, "Project doesnot exits || Wrong project ID"));
    }
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(new ApiError(400, "No valid fields provided to update"));
    }

    const updated = await Project.findByIdAndUpdate(
      projectId,
      { $set: updates },
      { new: true },
    );
    if (!updated) {
      return res.status(500).json(new ApiError(500, "Error updating project"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updated, "Project updated successfully"));
  } catch (error) {
    console.log("❌ Update Project Controller Error", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

// * DONE
const deleteProject = async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json(new ApiError(400, "Project ID is required"));
  }
  try {
    // Step 2: Check if the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json(new ApiError(404, "Project not found or wrong project ID"));
    }
    // Step 3: Cascade delete (tasks, project members, notes)
    await Task.deleteMany({ project: projectId });
    await ProjectMember.deleteMany({ project: projectId });
    await ProjectNote.deleteMany({ project: projectId });

    // Step 4: Delete the project
    await Project.deleteOne({ _id: projectId });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Project deleted successfully"));
  } catch (error) {
    console.log("❌ Delete Project Error", error);
    return res
      .status(500)
      .json(new ApiError(500, "Internal Server Error", error.message));
  }
};

// * DONE
const getProjectMembers = async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json(new ApiError(400, "Project ID is required"));
  }
  try {
    const result = await ProjectMember.aggregate([
      { $match: { project: projectId } },
      {
        $project: {
          _id: 1,
          user: 1,
          role: 1,
        },
      },
    ]);

    return res.status(200).json(new ApiResponse(200, result, "Members found"));
  } catch (err) {
    console.error("Aggregation Error:", err);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to get project members"));
  }
};

// * DONE
const addMemberToProject = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;

  // check if ids and roles are passed
  if (!projectId || !userId || !role) {
    return res
      .status(400)
      .json(new ApiError(400, "Project ID, User ID, and role are required"));
  }
  // check if ids are valid
  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res
      .status(400)
      .json(new ApiError(400, "Bad Request. Invalid userId and projectId"));
  }
  // check if project exits
  const project = await Project.findById(projectId);
  if (!project) {
    return res
      .status(404)
      .json(new ApiError(404, `Project with id:${projectId} doesnot exists`));
  }
  // check if user exits
  const user = await User.findById(userId);
  if (!user) {
    return res
      .status(404)
      .json(new ApiError(404, `User with id:${userId} doesnot exits`));
  }

  if (
    ![
      UserRolesEnum.ADMIN,
      UserRolesEnum.PROJECT_ADMIN,
      UserRolesEnum.MEMBER,
    ].includes(role)
  ) {
    return res.status(401).json(new ApiError(401, "Invalid role"));
  }

  // Check if member already exists
  const alreadyMember = await ProjectMember.findOne({
    project: projectId,
    user: userId,
  });
  if (alreadyMember) {
    return res.status(409).json(new ApiError(409, "Already member of project"));
  }

  // create new member document only by admin
  try {
    if (project.createdBy.toString() === req.user._id) {
      const callerMember = await ProjectMember.findOne({
        project: projectId,
        user: req.user._id,
      });
      if (
        !callerMember ||
        ![UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN].includes(
          callerMember.role,
        )
      ) {
        return res
          .status(403)
          .json(new ApiError(403, "You do not have permission to add members"));
      }
    }
    const newProjectMemeber = await ProjectMember.create({
      user: userId,
      project: projectId,
      role,
    });
    if (!newProjectMemeber) {
      return res
        .status(500)
        .json(new ApiError(500, "Error creating project member"));
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newProjectMemeber,
          "New project member added successfully",
        ),
      );
  } catch (error) {
    console.log("AddMemberToProject controller error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const deleteMember = async (req, res) => {
  const { projectId, memberId } = req.body;

  if (!projectId || !memberId) {
    return res
      .status(400)
      .json(new ApiError(400, "Project ID and Member ID required"));
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json(new ApiError(404, "Project not found"));
    }

    // Check permissions
    if (project.createdBy.toString() !== req.user._id) {
      const callerMember = await ProjectMember.findOne({
        project: projectId,
        user: req.user._id,
        role: { $in: [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN] },
      });
      if (!callerMember) {
        return res
          .status(403)
          .json(new ApiError(403, "Not authorized to remove members"));
      }
    }

    // Don't allow removing the project creator
    const memberToDelete = await ProjectMember.findById(memberId);
    if (!memberToDelete) {
      return res.status(404).json(new ApiError(404, "Member not found"));
    }

    if (memberToDelete.user.toString() === project.createdBy.toString()) {
      return res
        .status(400)
        .json(new ApiError(400, "Cannot remove project creator"));
    }

    await ProjectMember.deleteOne({ _id: memberId });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Member removed successfully"));
  } catch (error) {
    console.error("Delete member error:", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

const updateMemberRole = async (req, res) => {
  const { projectId, memberId, role } = req.body;
  // Validate required fields
  if (!projectId || !memberId || !role) {
    return res
      .status(400)
      .json(new ApiError(400, "Project ID, Member ID, and role are required"));
  }
  // Validate ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(memberId)
  ) {
    return res
      .status(400)
      .json(new ApiError(400, "Invalid Project ID or Member ID"));
  }

  try {
    // Check if the ProjectMember exists within the specified project
    const existingMember = await ProjectMember.findOne({
      _id: memberId,
      project: projectId,
    });

    if (!existingMember) {
      return res
        .status(404)
        .json(new ApiError(404, "Project member not found"));
    }
    // Update the role with validation
    const updatedMember = await ProjectMember.findByIdAndUpdate(
      memberId,
      { role },
      { new: true, runValidators: true }, // Enforce schema validators
    );
    // Send success response with updated member data
    return res
      .status(200)
      .json(new ApiResponse(200, updatedMember, "Role updated successfully"));
  } catch (error) {
    console.error("UpdateMemberRole error:", error);
    // Handle validation errors (e.g., invalid role)
    if (error.name === "ValidationError") {
      return res.status(400).json(new ApiError(400, error.message));
    }
    // Generic server error
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
};
