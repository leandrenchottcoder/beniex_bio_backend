import Setting from "../models/Setting.js";
import appError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const addSetting = catchAsync(async (req, res, next) => {
  const { 
    phone, 
    email, 
    adresse, 
    temps_ouverture,
    facebook_link,
    tik_tok_link,
    instagram_link,
   } = req.body;

  // Validation des champs obligatoires
  if (!phone) {
    return next(new appError("Le téléphone est obligatoire", 400));
  }


  // Créer le nouveau paramètre
  const newSetting = await Setting.create({
    phone: phone.trim(),
    email: email.trim(),
    adresse: adresse.trim(),
    temps_ouverture: temps_ouverture.trim(),
    facebook_link: facebook_link.trim(),
    tik_tok_link: tik_tok_link.trim(),
    instagram_link: instagram_link.trim()
  });

  // Réponse de succès
  res.status(201).json({
    status: 'success',
    message: 'Paramètre crée avec succès',
    data: newSetting
  });
});

export const getAllSetting = async (req, res) => {
  if (!req.user) {
    return res.status(403).json({
      error: "Unauthorized: Not authorized",
    });
  }

  try {
    const settings = await Setting.find().sort({createdAt : -1}).select("");
    res.status(200).json({
      message: "All settings",
      data: settings,
    });
  } catch (error) {
    console.error(`Error getting settings: ${error}`);
    res.status(500).json({
      error: "Error getting all settings",
    });
  }
};

/**
 * Get a setting by id
 */
export const getSettingById = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Not authorized" });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Setting id is required" });
  }

  try {
    const setting = await Setting.findById(id).select("");
    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }

    // Build response object
    const publicFields = {
      _id: setting._id,
      phone: setting.phone,
      email: setting.email,
      adresse: setting.adresse,
      temps_ouverture: setting.temps_ouverture,
      facebook_link: setting.facebook_link,
      tik_tok_link: setting.tik_tok_link,
      instagram_link: setting.instagram_link,
      createdAt: setting.createdAt,
    };

    res.status(200).json({ message: "Setting", data: publicFields });
  } catch (error) {
    console.error(`Error getting setting by id: ${error}`);
    res.status(500).json({ error: "Error getting setting" });
  }
};

export const updateSetting = async (req, res) => {
  // only allow admins to update paramètres
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Setting id is required" });
  }

  try {
    const updatedSetting = await Setting.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedSetting) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.status(200).json({
      message: "Setting updated successfully",
      data: updatedSetting,
    });
  } catch (error) {
    console.error(`Error updating setting: ${error}`);
    res.status(500).json({
      error: "Error updating setting",
    });
  }
};

export const deleteSetting = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Unauthorized: User not authorized",
    });
  }
  try {
    const deletedSetting = await Setting.findOneAndDelete({
      phone: req.body.phone,
    });
    res.status(200).json({
      message: "Setting deleted successfully",
      data: deletedSetting,
    });
  } catch (error) {
    console.error(`Error deleting setting: ${error}`);
    res.status(500).json({
      error: "Error deleting setting",
    });
  }
};