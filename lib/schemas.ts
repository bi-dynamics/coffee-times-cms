import { z } from "zod";

export const ListingStatus = z.enum(["draft", "active"]);
export type ListingStatus = z.infer<typeof ListingStatus>;

// Base schema for shared fields
const baseSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  images: z.array(z.string()).default([]),
  phone_number: z.string().optional(),
  email_address: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  town: z.string().min(1, "Town is required"),
  suburb: z.string().min(1, "Suburb is required"),
  status: ListingStatus.default("draft"),
});

// Category specific schemas
export const schemas = {
  accomodations: baseSchema.extend({
    bedrooms: z.number().min(0).default(0),
    bathrooms: z.number().min(0).default(0),
    features: z.array(z.string()).default([]),
  }),
  accounting: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  beauty: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  car_sales: baseSchema,
  cleaning_services: baseSchema.extend({
    services: z.array(z.string()).default([]),
    note: z.string().optional(),
  }),
  construction: baseSchema,
  education_and_training: baseSchema,
  electrical_devices: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  employment: baseSchema,
  food: baseSchema,
  furniture_and_repairs: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  hospitality: baseSchema,
  investment: baseSchema,
  it_services: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  legal_services: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  mechanical_services: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  other: baseSchema,
  plumbing: baseSchema.extend({
    services: z.array(z.string()).default([]),
  }),
  public_notices: baseSchema,
  roadside_assistance: baseSchema,
  transport: baseSchema,
  travel_and_tourism: baseSchema,
};

export type Category = keyof typeof schemas;

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "accomodations", label: "Accomodations" },
  { id: "accounting", label: "Accounting" },
  { id: "beauty", label: "Beauty" },
  { id: "car_sales", label: "Car Sales" },
  { id: "cleaning_services", label: "Cleaning Services" },
  { id: "construction", label: "Construction" },
  { id: "education_and_training", label: "Education & Training" },
  { id: "electrical_devices", label: "Electrical Devices" },
  { id: "employment", label: "Employment" },
  { id: "food", label: "Food" },
  { id: "furniture_and_repairs", label: "Furniture & Repairs" },
  { id: "hospitality", label: "Hospitality" },
  { id: "investment", label: "Investment" },
  { id: "it_services", label: "IT Services" },
  { id: "legal_services", label: "Legal Services" },
  { id: "mechanical_services", label: "Mechanical Services" },
  { id: "other", label: "Other" },
  { id: "plumbing", label: "Plumbing" },
  { id: "public_notices", label: "Public Notices" },
  { id: "roadside_assistance", label: "Roadside Assistance" },
  { id: "transport", label: "Transport" },
  { id: "travel_and_tourism", label: "Travel & Tourism" },
];
