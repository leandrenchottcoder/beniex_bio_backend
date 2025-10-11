import Blog from "../models/Blog.js";
import appError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import fs from "fs";

export const addBlog = catchAsync(async (req, res, next) => {
  const { title, description, is_Published } = req.body;

  // Validation des champs obligatoires
  if (!title) {
    return next(new appError("Le titre est obligatoire", 400));
  }

  // Vérifier si le titre existe déjà (insensible à la casse)
  const existingTitle = await Blog.findOne({
    title: { $regex: new RegExp(`^${title}$`, 'i') },
  });

  if (existingTitle) {
    return next(new appError("Ce titre existe déjà", 409));
  }

  // Process uploaded images (available when using multer memoryStorage)
  const imagesBase64 = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      // file.buffer is available because we're using memoryStorage
      if (file && file.buffer) {
        const base64 = file.buffer.toString('base64');
        // store data URI with mime type so it can be directly used in img src
        imagesBase64.push(`data:${file.mimetype};base64,${base64}`);
      }
    }
  }

  // Create the new blog (use Blog model)
  const newBlog = await Blog.create({
    title: title.trim(),
    description: description ? description.trim() : '',
    is_Published: is_Published !== undefined ? is_Published : 1,
    images: imagesBase64,
  });

  // Success response
  res.status(201).json({
    status: 'success',
    message: 'Blog créé avec succès',
    data: newBlog,
  });
});

export const getAllBlog = async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      error: "Unauthorized: Not authorized",
    });
  }

  try {
    const blogs = await Blog.find().sort({createdAt : -1}).select("");
    res.status(200).json({
      message: "All blogs",
      data: blogs,
    });
  } catch (error) {
    console.error(`Error getting blogs: ${error}`);
    res.status(500).json({
      error: "Error getting all blogs",
    });
  }
};

/**
 * Get a blog by id
 */
export const getBlogById = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Not authorized" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Blog id is required" });
  }

  try {
    const blog = await Blog.findById(id).select("");
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Build response object
    const publicFields = {
      _id: blog._id,
      title: blog.title,
      description: blog.description,
      is_Published: blog.is_Published,
      image : blog.images && blog.images.length > 0 ? blog.images[0] : null,
      createdAt: blog.createdAt,
    };

    res.status(200).json({ message: "Blog", data: publicFields });
  } catch (error) {
    console.error(`Error getting blog by id: ${error}`);
    res.status(500).json({ error: "Error getting blog" });
  }
};

export const updateBlog = async (req, res) => {
  // only allow admins to update blogs
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Blog id is required" });
  }

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    console.error(`Error updating blog: ${error}`);
    res.status(500).json({
      error: "Error updating blog",
    });
  }
};

export const deleteBlog = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }
  try {
    const deletedBlog = await Blog.findOneAndDelete({
      title: req.body.title,
    });
    res.status(200).json({
      message: "Blog deleted successfully",
      data: deletedBlog,
    });
  } catch (error) {
    console.error(`Error deleting blog: ${error}`);
    res.status(500).json({
      error: "Error deleting blog",
    });
  }
};