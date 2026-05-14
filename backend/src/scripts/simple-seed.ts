import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';

// Interfaces simples pour le seed
interface User {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
  bio?: string;
  specialties?: string[];
  articlesCount?: number;
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  categories: string[];
  tags: string[];
  status: string;
  featureStatus: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  allowComments: boolean;
  isPinned: boolean;
  readTimeMinutes: number;
  publishedAt: Date;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  articlesCount: number;
  sortOrder: number;
}

@Injectable()
class SimpleSeedService {
  constructor() {}

  async seedAll() {
    console.log('🌱 Début du seeding simple...');
    
    try {
      // Connexion directe à MongoDB
      const mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms-blog');
      
      const db = mongoose.connection.db;
      
      // Créer les collections si elles n'existent pas
      await db.createCollection('users');
      await db.createCollection('articles');
      await db.createCollection('categories');
      
      const usersCollection = db.collection('users');
      const categoriesCollection = db.collection('categories');
      const articlesCollection = db.collection('articles');
      
      // Vider les collections
      await usersCollection.deleteMany({});
      await categoriesCollection.deleteMany({});
      await articlesCollection.deleteMany({});
      
      console.log('🗑️ Collections vidées');
      
      // Créer les utilisateurs
      const users = [
        {
          email: 'admin@recettes.com',
          password: await bcrypt.hash('admin123', 10),
          firstName: 'Admin',
          lastName: 'System',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Administrateur du système',
          specialties: ['Plats traditionnels', 'Pâtisserie'],
          articlesCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: 'chef.marie@recettes.com',
          password: await bcrypt.hash('chef123', 10),
          firstName: 'Marie',
          lastName: 'Dubois',
          role: 'EDITOR',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Chef professionnelle passionnée par la cuisine française',
          specialties: ['Cuisine française', 'Pâtisserie', 'Vin'],
          articlesCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: 'paul.cuisine@recettes.com',
          password: await bcrypt.hash('paul123', 10),
          firstName: 'Paul',
          lastName: 'Martin',
          role: 'AUTHOR',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Amateur de cuisine et food blogger',
          specialties: ['Cuisine italienne', 'Desserts'],
          articlesCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          email: 'sophie.veggie@recettes.com',
          password: await bcrypt.hash('sophie123', 10),
          firstName: 'Sophie',
          lastName: 'Leroy',
          role: 'AUTHOR',
          status: 'ACTIVE',
          emailVerified: true,
          bio: 'Végétarienne passionnée et créative',
          specialties: ['Cuisine végétarienne', 'Bio', 'Sans gluten'],
          articlesCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const userResult = await usersCollection.insertMany(users);
      console.log(`✅ ${userResult.insertedCount} utilisateurs créés`);
      
      // Créer les catégories
      const categories = [
        {
          name: 'Entrées',
          slug: 'entrees',
          description: 'Recettes de starters et apéritifs',
          status: 'ACTIVE',
          articlesCount: 0,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Plats principaux',
          slug: 'plats-principaux',
          description: 'Recettes complètes et équilibrées',
          status: 'ACTIVE',
          articlesCount: 0,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Desserts',
          slug: 'desserts',
          description: 'Pâtisseries et douceurs sucrées',
          status: 'ACTIVE',
          articlesCount: 0,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Boissons',
          slug: 'boissons',
          description: 'Cocktails, jus et boissons variées',
          status: 'ACTIVE',
          articlesCount: 0,
          sortOrder: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Végétarien',
          slug: 'vegetarien',
          description: 'Recettes sans viande',
          status: 'ACTIVE',
          articlesCount: 0,
          sortOrder: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Cuisine rapide',
          slug: 'cuisine-rapide',
          description: 'Recettes faciles et rapides à préparer',
          status: 'ACTIVE',
          articlesCount: 0,
          sortOrder: 6,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const categoryResult = await categoriesCollection.insertMany(categories);
      console.log(`✅ ${categoryResult.insertedCount} catégories créées`);
      
      // Créer les articles
      const articles = [
        {
          title: 'Ratatouille traditionnelle provençale',
          slug: 'ratatouille-traditionnelle-provencale',
          excerpt: 'Découvrez la recette authentique de la ratatouille, un plat méditerranéen plein de saveurs',
          content: `La ratatouille est un plat traditionnel de la cuisine provençale qui met en valeur les légumes du soleil.

## Ingrédients
- 2 aubergines
- 3 courgettes  
- 4 tomates mûres
- 2 poivrons (1 rouge, 1 vert)
- 1 oignon
- 3 gousses d'ail
- Herbes de Provence
- Huile d'olive

## Préparation
1. Coupez tous les légumes en dés
2. Faites revenir l'oignon dans l'huile d'olive
3. Ajoutez les aubergines et les poivrons
4. Incorporez les courgettes et les tomates
5. Assaisonnez avec les herbes de Provence
6. Laissez mijoter pendant 30 minutes

Ce plat se déguste chaud ou froid, accompagné de pain frais.`,
          author: userResult.insertedIds[1], // Chef Marie
          categories: [categoryResult.insertedIds[1], categoryResult.insertedIds[4]], // Plats principaux, Végétarien
          tags: ['légumes', 'méditerranéen', 'traditionnel', 'été'],
          status: 'PUBLISHED',
          featureStatus: 'FEATURED',
          viewsCount: 1250,
          likesCount: 89,
          commentsCount: 12,
          allowComments: true,
          isPinned: true,
          readTimeMinutes: 25,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Tiramisu maison facile',
          slug: 'tiramisu-maison-facile',
          excerpt: 'La recette du tiramisu italien classique, crémeux et délicieux',
          content: `Le tiramisu est le dessert italien par excellence. Voici une version facile à réaliser chez vous.

## Ingrédients
- 300g de biscuits à la cuillère
- 500g de mascarpone
- 4 jaunes d'oeufs
- 100g de sucre
- 3 blancs d'oeufs
- 300ml de café fort
- 50ml de Marsala ou Amaretto
- Cacao en poudre

## Préparation
1. Séparez les jaunes des blancs
2. Fouettez les jaunes avec le sucre
3. Ajoutez la mascarpone
4. Montez les blancs en neige et incorporez-les délicatement
5. Trempez les biscuits dans le café
6. Montez le tiramisu en couches
7. Saupoudrez de cacao avant de servir

Laissez reposer au moins 4 heures au réfrigérateur.`,
          author: userResult.insertedIds[2], // Paul
          categories: [categoryResult.insertedIds[2]], // Desserts
          tags: ['dessert', 'italien', 'café', 'crémeux'],
          status: 'PUBLISHED',
          featureStatus: 'TRENDING',
          viewsCount: 890,
          likesCount: 67,
          commentsCount: 8,
          allowComments: true,
          isPinned: false,
          readTimeMinutes: 20,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'Smoothie vert détox',
          slug: 'smoothie-vert-detox',
          excerpt: 'Un smoothie plein de vitamines pour bien commencer la journée',
          content: `Ce smoothie vert est parfait pour une cure détox ou pour faire le plein d'énergie le matin.

## Ingrédients
- 2 poires
- 1 concombre
- Une poignée d'épinards frais
- Le jus d'un citron
- 200ml d'eau de coco
- 1 cuillère de graines de chia

## Préparation
1. Lavez bien tous les ingrédients
2. Coupez les poires et le concombre en morceaux
3. Mixez tous les ingrédients ensemble
4. Ajoutez les graines de chia et laissez reposer 5 minutes

Buvez immédiatement pour profiter de tous les bienfaits!`,
          author: userResult.insertedIds[3], // Sophie
          categories: [categoryResult.insertedIds[3], categoryResult.insertedIds[4]], // Boissons, Végétarien
          tags: ['smoothie', 'détox', 'santé', 'vitamines'],
          status: 'PUBLISHED',
          featureStatus: 'NONE',
          viewsCount: 456,
          likesCount: 34,
          commentsCount: 5,
          allowComments: true,
          isPinned: false,
          readTimeMinutes: 5,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const articleResult = await articlesCollection.insertMany(articles);
      console.log(`✅ ${articleResult.insertedCount} articles créés`);
      
      console.log('🎉 Seeding terminé avec succès!');
      console.log('\n📝 Comptes de test disponibles:');
      console.log('👤 Admin: admin@recettes.com / admin123');
      console.log('👨‍🍳 Chef: chef.marie@recettes.com / chef123');
      console.log('👨‍🍳 Auteur 1: paul.cuisine@recettes.com / paul123');
      console.log('👩‍🍳 Auteur 2: sophie.veggie@recettes.com / sophie123');
      
    } catch (error) {
      console.error('❌ Erreur lors du seeding:', error);
    } finally {
      if (mongoose.connection) {
        await mongoose.connection.close();
      }
    }
  }
}

async function runSimpleSeed() {
  const seedService = new SimpleSeedService();
  await seedService.seedAll();
}

runSimpleSeed();
