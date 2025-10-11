
import Support from "../models/Support.js";
import appError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import Counter from "../models/Counter.js";

export const addSupport = catchAsync(async (req, res, next) => {
  const { code_support, nom_complet, phone, email, message, statut } = req.body;

  // Validation des champs obligatoires
  if (!nom_complet || !phone || !message) {
    return next(new appError("Le nom complet ou le numéro de téléphone ou le message sont obligatoire", 400));
  }

  // Créer une nouvelle conversation
  // Helper: get next sequence atomically from Counter collection
  async function getNextSequence(name) {
    const updated = await Counter.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    ).lean();
    return updated.seq;
  }

  const finalCode = code_support && typeof code_support === 'string' && code_support.trim() !== ''
    ? code_support.trim()
    : `CO#${String(await getNextSequence('support')).padStart(6, '0')}`;

  const newSupport = await Support.create({
    code_support: finalCode,
    nom_complet: nom_complet.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : undefined,
    message: message.trim(),
    statut: statut,
  });

  // Réponse de succès
  res.status(201).json({
    status: 'success',
    message: 'Message crée avec succès',
    data: newSupport
  });
});

export const getAllSupport = async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      error: "Unauthorized: Not authorized",
    });
  }

  try {
    const supports = await Support.find().sort({createdAt : -1}).select("");
    res.status(200).json({
      message: "All supports",
      data: supports,
    });
  } catch (error) {
    console.error(`Error getting supports: ${error}`);
    res.status(500).json({
      error: "Error getting all supports",
    });
  }
};

/**
 * Get a support by id
 */
export const getSupportById = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Not authorized" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Support id is required" });
  }

  try {
    const support = await Support.findById(id).select("");
    if (!support) {
      return res.status(404).json({ error: "Support not found" });
    }

    // Build response object
    const publicFields = {
      _id: support._id,
      code_support: support.code_support,
      nom_complet: support.nom_complet,
      phone: support.phone,
      email: support.email,
      message: support.message,
      statut: support.statut,
      createdAt: support.createdAt,
    };

    res.status(200).json({ message: "Support", data: publicFields });
  } catch (error) {
    console.error(`Error getting support by id: ${error}`);
    res.status(500).json({ error: "Error getting support" });
  }
};

export const updateSupport = async (req, res) => {
  // only allow admins to update supports
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Support id is required" });
  }

  try {
    const updatedSupport = await Support.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedSupport) {
      return res.status(404).json({ error: "Support not found" });
    }

    res.status(200).json({
      message: "Support updated successfully",
      data: updatedSupport,
    });
  } catch (error) {
    console.error(`Error updating support: ${error}`);
    res.status(500).json({
      error: "Error updating support",
    });
  }
};

export const deleteSupport = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }
  try {
    const deletedSupport = await Support.findOneAndDelete({
      code_support: req.body.code_support,
    });
    res.status(200).json({
      message: "Support deleted successfully",
      data: deletedSupport,
    });
  } catch (error) {
    console.error(`Error deleting support: ${error}`);
    res.status(500).json({
      error: "Error deleting support",
    });
  }
};