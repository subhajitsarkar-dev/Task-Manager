import { Router } from "express";
import {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeMemberToProject,
  updateProject,
  updateProjectMembers,
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
  "/:projectId/member/create-member",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  addMemberToProject,
);

router.delete(
  "/:projectId/member/:memberId",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  removeMemberToProject,
);

router.get("/:projectId/members", getProjectMembers);

router.put(
  "/:projectId/member/update-members",
  isLoggedIn,
  validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
  updateProjectMembers,
); // Bulk update project members (Admin only)

router
  .route("/members/:memberId")
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
    deleteMember,
  );
export default router;
