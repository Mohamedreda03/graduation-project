const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim(),
  studentId: Joi.string().trim(),
  password: Joi.string().required().min(6),
  deviceInfo: Joi.object({
    deviceId: Joi.string().allow("", null),
    macAddress: Joi.string().required(),
  }),
}).xor("email", "studentId"); // Either email or studentId required

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().min(6),
  newPassword: Joi.string().required().min(6),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Passwords do not match",
    }),
});

module.exports = {
  loginSchema,
  changePasswordSchema,
};
