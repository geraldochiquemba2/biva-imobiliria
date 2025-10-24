import { storage } from "./storage";
import type { InsertProperty, InsertUser } from "@shared/schema";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    // Create admin corretor with fixed credentials
    const adminCorretor: InsertUser = {
      username: "admin",
      email: "admin@gmail.com",
      password: await bcrypt.hash("123456789", 10),
      fullName: "Administrador BIVA",
      phone: "+244 900 000 000",
      userType: "corretor",
    };

    // Create demo proprietário
    const demoProprietario: InsertUser = {
      username: "proprietario_demo",
      email: "proprietario@biva.ao",
      password: await bcrypt.hash("demo123", 10),
      fullName: "João Silva",
      phone: "+244 912 345 678",
      userType: "proprietario",
    };

    // Create demo client
    const demoCliente: InsertUser = {
      username: "cliente_demo",
      email: "cliente@biva.ao",
      password: await bcrypt.hash("demo123", 10),
      fullName: "Maria Santos",
      phone: "+244 923 456 789",
      userType: "cliente",
    };

    // Check if users already exist
    const existingAdmin = await storage.getUserByEmail(adminCorretor.email);
    const existingProprietario = await storage.getUserByEmail(demoProprietario.email);
    const existingCliente = await storage.getUserByEmail(demoCliente.email);

    const admin = existingAdmin || await storage.createUser(adminCorretor);
    const proprietario = existingProprietario || await storage.createUser(demoProprietario);
    const cliente = existingCliente || await storage.createUser(demoCliente);

    console.log("✓ Demo users created");
    console.log(`  - Admin Corretor: ${admin.email} / 123456789`);
    console.log(`  - Proprietário: ${proprietario.email} / demo123`);
    console.log(`  - Cliente: ${cliente.email} / demo123`);

    // Create demo properties
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
        area: 145,
        image: null,
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
        area: 280,
        image: null,
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
        area: 850,
        image: null,
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
        area: 220,
        image: null,
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
        area: 320,
        image: null,
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
        area: 85,
        image: null,
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
        area: 2500,
        image: null,
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
        area: 150,
        image: null,
        featured: false,
        status: "disponivel",
        ownerId: proprietario.id,
      },
    ];

    for (const property of demoProperties) {
      await storage.createProperty(property);
    }

    console.log("✓ Demo properties created");
    console.log(`Seeded ${demoProperties.length} properties successfully!`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
