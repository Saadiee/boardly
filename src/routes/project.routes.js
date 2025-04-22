import { Router } from "express";
import { isLoggedIn } from "../middlewares/isLogged.middleware.js";
import {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
} from "../controllers/project.controller.js";

const router = Router();

router.route("/create-project").post(isLoggedIn, createProject);
router.route("/get-project-by-id").post(isLoggedIn, getProjectById);
router.route("/get-projects").get(isLoggedIn, getProjects);
router.route("/update-project").post(isLoggedIn, updateProject);
router.route("/deleteProject").delete(isLoggedIn, deleteProject);
router.route("/project-members/:projectId").get(isLoggedIn, getProjectMembers);
router.route("/add-members/:projectId").post(isLoggedIn, addMemberToProject);
router.route("/delete-member").post(isLoggedIn, deleteMember);

export default router;
