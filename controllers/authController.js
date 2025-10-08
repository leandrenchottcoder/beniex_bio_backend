import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import appError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import sendEmail from "../utils/email.js";

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  console.log(user._id);
  const token = signToken(user._id);
  const role = user.role;
  const fullName = user.fullName;
  const email = user.email;
  const username = user.username;
  const phone = user.phone;
  res.status(statusCode).json({
    status: "success",
    fullName,
    email,
    username,
    phone,
    role,
    token,
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { fullName, email, username, password, passwordConfirm, phone } =
    req.body;
  if (password !== passwordConfirm) {
    return next(new appError("Les mots de passe ne correspondent pas", 400));
  }
  const newUser = await User.create({
    fullName,
    email,
    username,
    password,
    passwordConfirm,
    phone,
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(new appError("Nom d'utilisateur ou mot de passe incorrect", 401));
  }

  createSendToken(user, 200, res);
});

export const logout = (req, res) => {
  res.status(200).json({ status: "success" });
};

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new appError("Vous n'êtes pas connecté. Veuillez vous connecter pour accéder.", 401)
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new appError("L'utilisateur appartenant à ce jeton n'existe plus.", 401)
    );
  }

  req.user = currentUser;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError("Vous n'êtes pas autorisé à effectuer cette action.", 403)
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new appError("Utilisateur introuvable avec cette adresse e-mail.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `http://localhost:3000/api/users/resetPassword/${resetToken}`;
  const message = `Vous avez oublié votre mot de passe ? Soumettez une demande de PATCH avec votre nouveau mot de passe et le mot de passe Confirmation à: ${resetURL}.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Votre jeton de réinitialisation du mot de passe (valable 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Jeton envoyé à l'email !",
      resetToken,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new appError("Erreur lors de l'envoi de l'e-mail. Veuillez réessayer plus tard.", 500)
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new appError("Le jeton n'est pas valide ou a expiré", 400));
  }

  // Update user's password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm; // Ensure passwordConfirm matches new password
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res); // Send new token after password reset
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password, passwordConfirm } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.correctPassword(currentPassword))) {
    return next(new appError("Mot de passe actuel incorrect", 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
