import Category from "../models/Category.js";
import appError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const addCategory = catchAsync(async (req, res, next) => {
  const { category, is_Published } = req.body;

  // Validation des champs obligatoires
  if (!category) {
    return next(new appError("Le nom de la catégorie est obligatoire", 400));
  }

  // Vérifier si la catégorie existe déjà
  const existingCategory = await Category.findOne({ 
    category: { $regex: new RegExp(`^${category}$`, 'i') } 
  });

  if (existingCategory) {
    return next(new appError("Cette catégorie existe déjà", 409));
  }

  // Créer la nouvelle catégorie
  const newCategory = await Category.create({
    category: category.trim(),
    is_Published: is_Published,
  });

  // Réponse de succès
  res.status(201).json({
    status: 'success',
    message: 'Catégorie créée avec succès',
    data: newCategory
  });
});

export const getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find().sort({createdAt : -1}).select("");
    res.status(200).json({
      message: "All categories",
      data: categories,
    });
  } catch (error) {
    console.error(`Error getting categories: ${error}`);
    res.status(500).json({
      error: "Error getting all categories",
    });
  }
};

/**
 * Get a category by id
 */
export const getCategoryById = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Not authorized" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Category id is required" });
  }

  try {
    const category = await Category.findById(id).select("");
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Build response object
    const publicFields = {
      _id: category._id,
      category: category.category,
      is_Published: category.is_Published,
      createdAt: category.createdAt,
    };

    res.status(200).json({ message: "Category", data: publicFields });
  } catch (error) {
    console.error(`Error getting category by id: ${error}`);
    res.status(500).json({ error: "Error getting category" });
  }
};

export const adminUpdateCategory = async (req, res) => {
  // only allow admins to update categories
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Category id is required" });
  }

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(`Error updating category: ${error}`);
    res.status(500).json({
      error: "Error updating category",
    });
  }
};

export const adminDeleteCategory = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }
  try {
    const deletedCategory = await Category.findOneAndDelete({
      category: req.body.category,
    });
    res.status(200).json({
      message: "Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    console.error(`Error deleting category: ${error}`);
    res.status(500).json({
      error: "Error deleting category",
    });
  }
};