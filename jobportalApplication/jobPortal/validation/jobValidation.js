const joi = require("joi");

const jobSchema = joi.object({
  title: joi.string().trim().min(3).max(120).pattern(/[a-zA-Z]/).required().messages({
    "string.base": "Job Title must be a valid text string",
    "string.empty": "Job Title is required",
    "string.min": "Job Title must be at least 3 characters long",
    "string.max": "Job Title cannot exceed 120 characters",
    "string.pattern.base": "Job Title must contain alphabetic letters and cannot be purely numbers",
    "any.required": "Job Title is required",
  }),

  // Company Information
  companyName: joi.string().trim().allow("", null),
  companyWebsite: joi.string().trim().allow("", null),
  companyIndustry: joi.string().trim().allow("", null),
  companySize: joi.string().trim().allow("", null),
  companyAbout: joi.string().trim().allow("", null),
  companyLogo: joi.string().allow("", null),

  jobSummary: joi.string().trim().min(10).required().messages({
    "string.empty": "Job Summary is required",
    "string.min": "Job Summary must be at least 10 characters long",
    "any.required": "Job Summary is required",
  }),

  salary: joi.number().min(0).required().messages({
    "number.base": "Salary budget must be a valid number (e.g. 600000 or 50000)",
    "number.min": "Salary budget cannot be negative",
    "any.required": "Salary is required",
  }),

  location: joi.string().trim().min(2).messages({
    "string.empty": "Job Location is required",
    "string.min": "Location must be at least 2 characters",
  }),

  jobLocation: joi.string().trim().min(2).messages({
    "string.empty": "Job Location is required",
    "string.min": "Job Location must be at least 2 characters",
  }),

  vacancy: joi.number().integer().min(1).required().messages({
    "number.base": "Vacancy count must be a number",
    "number.min": "Vacancy count must be at least 1",
    "number.integer": "Vacancy count must be a whole number",
    "any.required": "Vacancy count is required",
  }),

  experience: joi.number().min(0).required().messages({
    "number.base": "Experience must be a number representing years (e.g. 0 for Fresher, 2, 5)",
    "number.min": "Experience years cannot be negative",
    "any.required": "Experience level (in years) is required",
  }),

  jobType: joi.string().allow("", null),

  deadline: joi.alternatives().try(joi.date(), joi.string()).required().messages({
    "any.required": "Application deadline is required",
  }),

  template: joi.string().allow("", null),

  imageUrl: joi.string().allow("", null),
}).or("jobLocation", "location").messages({
  "object.missing": "Job Location is required",
});

module.exports = jobSchema;

