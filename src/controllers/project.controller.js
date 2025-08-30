import { asyncHandler } from "../utils/async-handler";

export const getProjects = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const createProject = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const updateProject = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const addMemberToProject = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const removeMemberToProject = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const getProjectMembers = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const updateProjectMembers = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const updateProjectMemberRole = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});

export const deleteMember = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;
});
