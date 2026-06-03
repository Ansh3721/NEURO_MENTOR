const Joi = require("joi");

const subjectSchema = Joi.object({
    name: Joi.string().trim().required(),
    level: Joi.string().valid("Beginner", "Intermediate", "Advanced").required(),
});

const studentDetailsSchema = Joi.object({
    degree: Joi.string().trim().required(),
    college: Joi.string().trim().required(),
    yearSemester: Joi.string().trim().required(),
    cgpaPointer: Joi.string().trim().required(),
    subjectGrades: Joi.string().trim().required(),
});

const professionalDetailsSchema = Joi.object({
    jobRole: Joi.string().trim().required(),
    companyName: Joi.string().trim().required(),
    yearsExperience: Joi.number().min(0).max(60).required(),
    previousExperience: Joi.string().allow("").optional(),
});

const socialProfilesSchema = Joi.object({
    linkedin: Joi.string().uri().required(),
    github: Joi.string().uri().allow("").optional(),
    instagram: Joi.string().uri().allow("").optional(),
    portfolio: Joi.string().uri().allow("").optional(),
});

const availabilitySchema = Joi.object({
    days: Joi.alternatives().try(
        Joi.array().items(Joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")).min(1),
        Joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    ).required().messages({
        "any.required": "Please select at least one available day.",
        "alternatives.any": "Please select at least one available day.",
        "alternatives.match": "Please select at least one available day.",
    }),
    timeSlots: Joi.string().trim().required(),
});

const identityVerificationSchema = Joi.object({
    idType: Joi.string().valid("Aadhaar", "PAN", "Passport", "Driving License").required(),
});

const agreementsSchema = Joi.object({
    confirmAccuracy: Joi.boolean().truthy("on", "true").valid(true).required(),
    acceptTerms: Joi.boolean().truthy("on", "true").valid(true).required(),
});

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        name : Joi.string().trim().required(),
        bio : Joi.string().trim().min(100).max(2000).required(),
        location : Joi.string().trim().required(),
        languages : Joi.string().trim().required(),
        educatorType : Joi.string().valid("Student", "Professional").required(),
        studentDetails : Joi.when("educatorType", {
            is: "Student",
            then: studentDetailsSchema.required(),
            otherwise: Joi.object().optional(),
        }),
        professionalDetails : Joi.when("educatorType", {
            is: "Professional",
            then: professionalDetailsSchema.required(),
            otherwise: Joi.object().optional(),
        }),
        subjects : Joi.array().items(subjectSchema).min(1).required(),
        socialProfiles : socialProfilesSchema.optional(),
        availability : availabilitySchema.required(),
        pricing : Joi.number().valid(50, 100, 150, 200, 300, 500, 750, 1000).required(),
        identityVerification : identityVerificationSchema.required(),
        agreements : agreementsSchema.required(),
    }).unknown(true).required(),
});

module.exports.stu_problemSchema = Joi.object({
    stu_problem : Joi.object({
        rating : Joi.number().required().min(1).max(5),
        problem : Joi.string().required(),
    }).required(),
});