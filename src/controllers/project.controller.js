import mongoose from "mongoose";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AvilableUserRoles, UserRolesEnum } from "../utils/constants.js";

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

  try {
    const createdProject = await Project.create({
      name,
      description,
      createdBy,
    });

    await ProjectMember.create({
      project: new mongoose.Types.ObjectId(createProject._id),
      user: new mongoose.Types.ObjectId(createdBy),
      role: UserRolesEnum.ADMIN,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdProject, "Project created successfully😊"),
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

  if (!projectId) {
    throw new ApiError(403, "Project not found");
  }
  try {
    await Project.findByIdAndDelete(projectId);

    await ProjectMember.deleteMany({ project: projectId });
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

export const addMemberToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email, role = UserRolesEnum.MEMBER } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId) || !email) {
    throw new ApiError(400, "Invalid project ID or user ID");
  }

  if (!AvilableUserRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }
  try {
    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      throw new ApiError(403, "User not found!");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(403, "User not found!");
    }

    const existingMember = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(user._id),
    });

    if (!existingMember) {
      throw new ApiError(403, "User is already a member of this project!");
    }

    const createdMember = await ProjectMember.create({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(user._id),
      role,
    });

    await createdMember.populate("user", "username email fullname");

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdMember,
          "ProjectMember added successfully😊",
        ),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Project member added failed!",
        ),
      );
  }
});

export const removeMemberToProject = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;

  if (!projectId || !memberId) {
    throw new ApiError(403, "Invalid Project or Member");
  }
  try {
    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      throw new ApiError(403, "Project not found!");
    }

    const existingMember = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      _id: new mongoose.Types.ObjectId(memberId),
    });

    if (!existingMember) {
      throw new ApiError(403, "This member not exist on this project!");
    }

    await ProjectMember.findByIdAndDelete(memberId);

    return res
      .status(201)
      .json(new ApiResponse(201, "ProjectMember deleted successfully😊"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Project member remove failed!",
        ),
      );
  }
});

export const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    throw new ApiError(403, "Invalid Project ID");
  }
  try {
    const existingproject = await Project.findById(projectId);

    if (!existingproject) {
      throw new ApiError(403, "Project not found from DB");
    }

    const members = await ProjectMember.find({
      project: new mongoose.Types.ObjectId(projectId),
    }).populate("user", "username fullname");

    return res
      .status(201)
      .json(
        new ApiResponse(201, members, "ProjectMembers found successfully😊"),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          error.message || "Project member not found!",
        ),
      );
  }
});

// export const updateProjectMembers = asyncHandler(async (req, res) => {

// });

// export const updateProjectMemberRole = asyncHandler(async (req, res) => {});

// export const deleteMember = asyncHandler(async (req, res) => {});

export const updateProjectMemberRole = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;
  const { role } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(memberId)
  ) {
    throw new ApiError(400, "Invalid Project or Member ID");
  }

  if (!AvilableUserRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const existingProject = await Project.findById(projectId);
  if (!existingProject) {
    throw new ApiError(404, "Project not found!");
  }

  const existingMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    _id: new mongoose.Types.ObjectId(memberId),
  });

  if (!existingMember) {
    throw new ApiError(404, "Member not found in this project!");
  }

  const updatedMember = await ProjectMember.findByIdAndUpdate(
    memberId,
    { role },
    { new: true },
  ).populate("user", "username fullname email");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedMember, "Member role updated successfully😊"),
    );
});

export const deleteMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, "Invalid Member ID");
  }

  const deletedMember = await ProjectMember.findByIdAndDelete(memberId);

  if (!deletedMember) {
    throw new ApiError(404, "Member not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Member deleted successfully😊"));
});

export const updateProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { members } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid Project ID");
  }

  const existingProject = await Project.findById(projectId);
  if (!existingProject) {
    throw new ApiError(404, "Project not found!");
  }

  const invalidRoles = members.filter(
    (member) => !AvilableUserRoles.includes(member.role),
  );

  if (invalidRoles.length > 0) {
    throw new ApiError(400, "Invalid role(s) specified");
  }

  await ProjectMember.deleteMany({
    project: new mongoose.Types.ObjectId(projectId),
  });

  const memberPromises = members.map(async (member) => {
    const user = await User.findById(member.userId);
    if (!user) {
      throw new ApiError(404, `User with ID ${member.userId} not found`);
    }

    return ProjectMember.create({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(member.userId),
      role: member.role,
    });
  });

  const newMembers = await Promise.all(memberPromises);

  await ProjectMember.populate(newMembers, {
    path: "user",
    select: "username fullname email",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newMembers,
        "Project members updated successfully😊",
      ),
    );
});
