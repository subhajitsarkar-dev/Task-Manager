import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middlewares/auth.middleware.js";
import { AvilableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {
  createNote,
  deleNote,
  getNoteById,
  getNotes,
  updateNote,
} from "../controllers/note.controller.js";

const router = Router();

router
  .route("/:projectId/notes")
  .get(isLoggedIn, validateProjectPermission(AvilableUserRoles), getNotes)
  .post(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
    createNote,
  );

router
  .route("/:projectId/notes/:noteId")
  .get(isLoggedIn, validateProjectPermission(AvilableUserRoles), getNoteById)
  .put(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
    updateNote,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.PROJECT_ADMIN]),
    deleNote,
  );
export default router;
