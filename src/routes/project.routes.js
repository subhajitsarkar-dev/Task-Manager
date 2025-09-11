import { Router } from "express";
import {
  addMemberToProject,
  createProject,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeMemberToProject,
  updateProject,
} from "../controllers/project.controller.js";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.get("/", getProjects);
router.get("/:projectId", getProjectById);
router.post("/createProject", isLoggedIn, createProject);
router.patch(
  "/:projectId",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  updateProject,
);
router.delete(
  "/:projectId",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  deleteProject,
);

//members
router.post(
  "/:projectId/members/create-member",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  addMemberToProject,
);

router.delete(
  "/:projectId/members/:memberId",
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  removeMemberToProject,
);

router.get("/:projectId/members", getProjectMembers);

export default router;
