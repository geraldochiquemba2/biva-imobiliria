import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, searchPropertySchema } from "@shared/schema";
import { z } from "zod";
import { seedDatabase } from "./seed";

// Seed database on startup in development
if (process.env.NODE_ENV === "development") {
  seedDatabase().catch(console.error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Property Routes
  
  // Get all properties with optional filters
  app.get("/api/properties", async (req, res) => {
    try {
      const searchParams = searchPropertySchema.parse({
        type: req.query.type,
        category: req.query.category,
        bairro: req.query.bairro,
        municipio: req.query.municipio,
        provincia: req.query.provincia,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
      });
      
      const properties = await storage.listProperties(searchParams);
      res.json(properties);
    } catch (error) {
      console.error('Error listing properties:', error);
      res.status(400).json({ error: "Invalid search parameters" });
    }
  });

  // Get featured properties
  app.get("/api/properties/featured", async (req, res) => {
    try {
      const properties = await storage.listProperties({ featured: true });
      res.json(properties);
    } catch (error) {
      console.error('Error getting featured properties:', error);
      res.status(500).json({ error: "Failed to fetch featured properties" });
    }
  });

  // Get single property
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error('Error getting property:', error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  // Create new property (requires authentication - to be implemented)
  app.post("/api/properties", async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      console.error('Error creating property:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid property data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  // Update property (requires authentication - to be implemented)
  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const updates = req.body;
      const property = await storage.updateProperty(req.params.id, updates);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  // Delete property (requires authentication - to be implemented)
  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const success = await storage.deleteProperty(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Get properties by user (requires authentication - to be implemented)
  app.get("/api/users/:userId/properties", async (req, res) => {
    try {
      const properties = await storage.getUserProperties(req.params.userId);
      res.json(properties);
    } catch (error) {
      console.error('Error getting user properties:', error);
      res.status(500).json({ error: "Failed to fetch user properties" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
