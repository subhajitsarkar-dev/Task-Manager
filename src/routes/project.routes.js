import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
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

export default router;
