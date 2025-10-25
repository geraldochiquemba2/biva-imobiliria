import { storage } from "./storage";
import type { InsertProperty, InsertUser } from "@shared/schema";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    // Create admin with fixed credentials
    const adminUser: InsertUser = {
      username: "admin",
      email: "admin@biva.ao",
      password: await bcrypt.hash("123456789", 10),
      fullName: "Administrador BIVA",
      phone: "+244912345678",
      userType: "admin",
      sms: null,
      address: "Luanda, Angola",
      bi: "000000000LA000",
      profileImage: null,
    };

    // Check if admin exists
    const existingAdmin = await storage.getUserByPhone(adminUser.phone);

    const admin = existingAdmin || await storage.createUser(adminUser);

    console.log("✓ Admin user ready");
    console.log(`  - Admin: ${admin.phone} / 123456789`);

    // Define demo properties with stable titles
    // Commented out to remove demo data from production
    /*
    const demoProperties: InsertProperty[] = [
      {
        title: "Apartamento Luxuoso em Talatona",
        description: "Apartamento moderno e espaçoso com acabamentos de luxo, localizado no coração de Talatona. Possui ampla sala de estar, cozinha equipada e varandas com vista panorâmica.",
        type: "Arrendar",
        category: "Apartamento",
        price: "350000.00",
        bairro: "Talatona",
        municipio: "Belas",
        provincia: "Luanda",
        bedrooms: 3,
        bathrooms: 2,
        livingRooms: 1,
        kitchens: 1,
        area: 145,
        images: null,
        featured: true,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Villa Moderna com Jardim",
        description: "Casa moderna com amplo jardim, piscina e garagem para 3 carros. Design contemporâneo com grande área social e suites espaçosas.",
        type: "Vender",
        category: "Casa",
        price: "45000000.00",
        bairro: "Miramar",
        municipio: "Luanda",
        provincia: "Luanda",
        bedrooms: 4,
        bathrooms: 3,
        livingRooms: 2,
        kitchens: 1,
        area: 280,
        images: null,
        featured: false,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Edifício Comercial Centro",
        description: "Espaço comercial premium no centro de Luanda. Ideal para escritórios ou showroom. Excelente localização com amplo estacionamento.",
        type: "Vender",
        category: "Comercial",
        price: "120000000.00",
        bairro: "Maianga",
        municipio: "Luanda",
        provincia: "Luanda",
        bedrooms: 0,
        bathrooms: 4,
        livingRooms: 0,
        kitchens: 0,
        area: 850,
        images: null,
        featured: true,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Penthouse Vista Panorâmica",
        description: "Penthouse de luxo com vista panorâmica para a baía de Luanda. Acabamentos premium, terraço privativo e acesso exclusivo.",
        type: "Arrendar",
        category: "Apartamento",
        price: "500000.00",
        bairro: "Ilha de Luanda",
        municipio: "Luanda",
        provincia: "Luanda",
        bedrooms: 4,
        bathrooms: 3,
        livingRooms: 1,
        kitchens: 1,
        area: 220,
        images: null,
        featured: false,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Casa Familiar em Viana",
        description: "Casa espaçosa perfeita para famílias grandes. Jardim amplo, área de churrasqueira e quintal com espaço para lazer.",
        type: "Arrendar",
        category: "Casa",
        price: "180000.00",
        bairro: "Zango",
        municipio: "Viana",
        provincia: "Luanda",
        bedrooms: 5,
        bathrooms: 3,
        livingRooms: 2,
        kitchens: 1,
        area: 320,
        images: null,
        featured: false,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Apartamento T2 Centralizado",
        description: "Apartamento compacto e funcional no centro da cidade. Próximo a serviços e transportes públicos.",
        type: "Vender",
        category: "Apartamento",
        price: "18000000.00",
        bairro: "Ingombota",
        municipio: "Luanda",
        provincia: "Luanda",
        bedrooms: 2,
        bathrooms: 1,
        livingRooms: 1,
        kitchens: 1,
        area: 85,
        images: null,
        featured: false,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Terreno Comercial Via Expressa",
        description: "Terreno comercial estrategicamente localizado na via expressa. Ideal para construção de condomínio ou centro comercial.",
        type: "Vender",
        category: "Terreno",
        price: "35000000.00",
        bairro: "Talatona",
        municipio: "Belas",
        provincia: "Luanda",
        bedrooms: 0,
        bathrooms: 0,
        livingRooms: 0,
        kitchens: 0,
        area: 2500,
        images: null,
        featured: true,
        status: "disponivel",
        ownerId: proprietario.id,
      },
      {
        title: "Loja Comercial Shopping",
        description: "Loja comercial em shopping center de alto padrão. Localização privilegiada com grande fluxo de clientes.",
        type: "Arrendar",
        category: "Comercial",
        price: "450000.00",
        bairro: "Talatona",
        municipio: "Belas",
        provincia: "Luanda",
        bedrooms: 0,
        bathrooms: 2,
        livingRooms: 0,
        kitchens: 0,
        area: 150,
        images: null,
        featured: false,
        status: "disponivel",
        ownerId: proprietario.id,
      },
    ];

    // Check and create each demo property individually
    const existingProperties = await storage.listProperties();
    const existingTitles = new Set(existingProperties.map(p => p.title));
    
    let createdCount = 0;
    for (const property of demoProperties) {
      if (!existingTitles.has(property.title)) {
        await storage.createProperty(property);
        createdCount++;
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Demo properties created (${createdCount} new properties)`);
    } else {
      console.log(`✓ Demo properties already exist (${demoProperties.length} properties)`);
    }
    */
    console.log("✓ Demo properties creation disabled");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
