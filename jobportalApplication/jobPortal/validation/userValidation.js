const joi = require("joi");

const userSchema = joi.object({
  name: joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),

  age: joi.number().min(18).required().messages({
    "number.min": "Age must be at least 18",
    "any.required": "Age is required",
  }),

  email: joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  gender: joi.string().valid("male", "female", "other").required().messages({
    "any.only": "Gender must be male, female, or other",
    "any.required": "Gender is required",
  }),

  password: joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),

  role: joi.string().valid("candidate", "recruiter", "admin").default("candidate"),

  phone: joi.string().allow("", null),

  location: joi.string().allow("", null),

  bio: joi.string().allow("", null),

  skills: joi.array().items(joi.string()).allow(null),

  resume: joi.string().allow("", null),

  profileImage: joi.string().allow("", null),

  education: joi.array().items(
    joi.object({
      degree: joi.string().allow("", null),
      college: joi.string().allow("", null),
      year: joi.number().allow(null),
    })
  ).allow(null),

  experience: joi.array().items(
    joi.object({
      company: joi.string().allow("", null),
      position: joi.string().allow("", null),
      duration: joi.string().allow("", null),
      years: joi.number().allow(null),
    })
  ).allow(null),
});

module.exports = userSchema;
