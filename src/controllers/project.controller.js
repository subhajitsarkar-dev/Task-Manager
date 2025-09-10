import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";

export const getProjects = asyncHandler(async (req, res) => {
  try {
    const project = await Project.find().populate(
      "createdBy",
      "username fullname",
    );

    if (!project) {
      throw new ApiError(500, "Project is not aviable!");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, project, "Project found "));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Projects isn't found!"),
      );
  }
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  try {
    const singleProject = await Project.findById(projectId);

    if (!singleProject) {
      throw new ApiError(500, "singleProject is not aviable!");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, singleProject, "singleProject found "));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Projects isn't found!"),
      );
  }
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const createdBy = req.user?._id;
  console.log();

  try {
    const createdProject = await Project.create({
      name,
      description,
      createdBy,
    });

    await ProjectMember.create({
      user: createdBy,
      project: createdProject._id,
      role: UserRolesEnum.PROJECT_ADMIN,
    });

    // const populatedProject = await Project.findById(createProject._id).populate(
    //   "createdBy",
    //   "username fullname",
    // );

    return res
      .status(201)
      .json(
        new ApiResponse(201, createProject, "Project created successfully😊"),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Projects isn't created!"),
      );
  }
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  try {
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      throw new ApiError(500, "Project not created");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { name, description },
      { new: true },
    ).populate("createdBy", "username fullname");

    return res
      .status(201)
      .json(
        new ApiResponse(201, updatedProject, "Project updated successfully😊"),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Projects does not updated!",
        ),
      );
  }
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  try {
    await Project.findByIdAndDelete(projectId);
    return res
      .status(201)
      .json(new ApiResponse(201, null, "Project deleted successfully😊"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, error.message || "Projects is not deleted!"),
      );
  }
});

export const addMemberToProject = asyncHandler(async (req, res) => {});

export const removeMemberToProject = asyncHandler(async (req, res) => {});

export const getProjectMembers = asyncHandler(async (req, res) => {});

export const updateProjectMembers = asyncHandler(async (req, res) => {});

export const updateProjectMemberRole = asyncHandler(async (req, res) => {});

export const deleteMember = asyncHandler(async (req, res) => {});
