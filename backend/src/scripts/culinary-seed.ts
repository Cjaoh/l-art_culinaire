import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole, UserStatus, UserDocument } from '../users/schemas/user.schema';
import { Article, ArticleStatus, ArticleDocument } from '../articles/schemas/article.schema';
import { Category, CategoryStatus, CategoryDocument } from '../categories/schemas/category.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get models
  const userModel = app.get('UserModel');
  const articleModel = app.get('ArticleModel');
  const categoryModel = app.get('CategoryModel');

  // Clean database
  await userModel.deleteMany({});
  await articleModel.deleteMany({});
  await categoryModel.deleteMany({});
  console.log('Database cleaned');

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminUser = await userModel.create({
    name: 'Admin CulinArt',
    email: 'admin@culinart.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    bio: 'Administrateur de la plateforme CulinArt'
  });
  console.log('Admin user created');

  // Create categories with icons
  const categoriesData = [
    { name: 'Entrées', slug: 'entrees', icon: '🥗', description: 'Plats d\'entrée et amuse-bouches' },
    { name: 'Plats', slug: 'plats', icon: '🍽️', description: 'Plats principaux chauds' },
    { name: 'Desserts', slug: 'desserts', icon: '🍰', description: 'Desserts sucrés et pâtisseries' },
    { name: 'Cuisine monde', slug: 'cuisine-monde', icon: '🌍', description: 'Spécialités culinaires du monde entier' },
    { name: 'Boissons', slug: 'boissons', icon: '🥤', description: 'Cocktails, jus et autres boissons' },
    { name: 'Végétarien', slug: 'vegetarien', icon: '🥦', description: 'Plats végétariens et végans' }
  ];

  const categories = await categoryModel.insertMany(
    categoriesData.map(cat => ({
      ...cat,
      status: CategoryStatus.ACTIVE,
      sortOrder: categoriesData.indexOf(cat) + 1
    }))
  );
  console.log('Categories created:', categories.length);

  // Create articles (2 per category = 12 total)
  const articlesData = [
    // Entrées
    {
      title: 'Salade niçoise classique',
      slug: 'salade-nicoise-classique',
      content: 'La salade niçoise est une spécialité culinaire de Nice. Cette recette traditionnelle combine des légumes frais, du thon, des œufs durs et des anchois pour créer un plat complet et rafraîchissant. Parfaite pour un repas estival, elle apporte toutes les saveurs de la Méditerranée dans votre assiette. Préparez-la avec des ingrédients de saison pour un résultat optimal.',
      author: adminUser._id,
      categories: [categories[0]._id],
      tags: ['salade', 'niçoise', 'été', 'méditerranéen'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 150,
      ingredients: [
        { name: 'Thon en conserve', quantity: '200', unit: 'g' },
        { name: 'Tomates', quantity: '4', unit: 'pièces' },
        { name: 'Poivrons', quantity: '2', unit: 'pièces' },
        { name: 'Œufs durs', quantity: '2', unit: 'pièces' },
        { name: 'Anchois', quantity: '4', unit: 'filets' }
      ],
      steps: [
        'Faire cuire les œufs durs (10 minutes)',
        'Laver et couper les tomates en quartiers',
        'Couper les poivrons en lanières',
        'Disposer tous les ingrédients dans un saladier',
        'Ajouter le thon et les anchois',
        'Assaisonner et servir frais'
      ],
      cookingTimeMinutes: 0,
      preparationTimeMinutes: 20,
      servings: 4
    },
    {
      title: 'Bruschetta tomate basilic',
      slug: 'bruschetta-tomate-basilic',
      content: 'Les bruschettas sont des appetizers italiens simples mais délicieux. Des tranches de pain grillées garnies de tomates fraîches, d\'ail, de basilic et d\'huile d\'olive. C\'est l\'en-cas parfait pour l\'apéritif ou une entrée légère. Le secret réside dans la qualité des ingrédients : des tomates mûres et parfumées, du basilic frais, et une bonne huile d\'olive extra vierge.',
      author: adminUser._id,
      categories: [categories[0]._id],
      tags: ['bruschetta', 'tomate', 'basilic', 'italien', 'apéritif'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 120,
      ingredients: [
        { name: 'Pain ciabatta', quantity: '1', unit: 'baguette' },
        { name: 'Tomates cerises', quantity: '200', unit: 'g' },
        { name: 'Basilic frais', quantity: '1', unit: 'botte' },
        { name: 'Ail', quantity: '2', unit: 'gousses' },
        { name: 'Huile d\'olive', quantity: '3', unit: 'c.à.s.' }
      ],
      steps: [
        'Couper le pain en tranches épaisses',
        'Faire griller les tranches au four',
        'Couper les tomates en dés',
        'Hacher le basilic et presser l\'ail',
        'Mélanger tomates, basilic, ail et huile',
        'Garnir les tranches grillées et servir'
      ],
      cookingTimeMinutes: 5,
      preparationTimeMinutes: 15,
      servings: 6
    },

    // Plats
    {
      title: 'Bœuf bourguignon traditionnel',
      slug: 'bœuf-bourguignon-traditionnel',
      content: 'Le bœuf bourguignon est un plat emblématique de la cuisine bourguignonne. Cette recette traditionnelle met en valeur des morceaux de bœuf mijotés lentement dans du vin rouge de Bourgogne, avec des oignons, des carottes et des champignons. Un plat réconfortant parfait pour les repas d\'hiver en famille. La clé du succès réside dans la qualité du vin et la patience lors de la cuisson.',
      author: adminUser._id,
      categories: [categories[1]._id],
      tags: ['bœuf', 'bourguignon', 'vin rouge', 'mijoté', 'traditionnel'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 280,
      ingredients: [
        { name: 'Bœuf pour bourguignon', quantity: '1,5', unit: 'kg' },
        { name: 'Vin rouge bourgogne', quantity: '75', unit: 'cl' },
        { name: 'Carottes', quantity: '4', unit: 'pièces' },
        { name: 'Oignons', quantity: '8', unit: 'pièces' },
        { name: 'Champignons de Paris', quantity: '300', unit: 'g' }
      ],
      steps: [
        'Couper la viande en morceaux',
        'Faire dorer les morceaux de bœuf',
        'Ajouter les oignons et carottes',
        'Déglacer avec le vin rouge',
        'Ajouter le bouillon et laisser mijoter 3 heures',
        'Ajouter les champignons en fin de cuisson'
      ],
      cookingTimeMinutes: 180,
      preparationTimeMinutes: 30,
      servings: 8
    },
    {
      title: 'Poulet rôti aux herbes',
      slug: 'poulet-rôti-herbes',
      content: 'Un poulet rôti juteux et parfumé, cuit lentement avec un mélange d\'herbes aromatiques. Ce plat classique de la cuisine française est simple à préparer mais toujours impressionnant. La peau croustillante et la chair tendre font de ce poulet un plat apprécié de tous. Servez-le avec des légumes de saison pour un repas complet et équilibré.',
      author: adminUser._id,
      categories: [categories[1]._id],
      tags: ['poulet', 'rôti', 'herbes', 'cuisson four', 'classique'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 200,
      ingredients: [
        { name: 'Poulet entier', quantity: '1,5', unit: 'kg' },
        { name: 'Thym', quantity: '3', unit: 'branches' },
        { name: 'Romarin', quantity: '2', unit: 'branches' },
        { name: 'Ail', quantity: '4', unit: 'gousses' },
        { name: 'Beurre', quantity: '100', unit: 'g' }
      ],
      steps: [
        'Préchauffer le four à 180°C',
        'Saler et poivrer l\'intérieur du poulet',
        'Insérer herbes et ail à l\'intérieur',
        'Badigeonner de beurre fondu',
        'Enfourner pour 1h30 de cuisson',
        'Laisser reposer 10 minutes avant de servir'
      ],
      cookingTimeMinutes: 90,
      preparationTimeMinutes: 15,
      servings: 6
    },

    // Desserts
    {
      title: 'Tarte tatin aux pommes',
      slug: 'tarte-tatin-pommes',
      content: 'La tarte Tatin est une tarte renversée aux pommes créée par erreur mais devenue un classique de la pâtisserie française. Les pommes caramélisées au beurre et au sucre, recouvertes d\'une pâte feuilletée et cuites à l\'envers, offrent un résultat spectaculaire. Servez-la tiède avec une boule de glace vanille pour un dessert inoubliable.',
      author: adminUser._id,
      categories: [categories[2]._id],
      tags: ['tarte', 'pommes', 'caramel', 'pâtisserie', 'classique'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 320,
      ingredients: [
        { name: 'Pommes Golden', quantity: '6', unit: 'pièces' },
        { name: 'Pâte feuilletée', quantity: '1', unit: 'rouleau' },
        { name: 'Sucre', quantity: '150', unit: 'g' },
        { name: 'Beurre', quantity: '100', unit: 'g' },
        { name: 'Cannelle', quantity: '1', unit: 'c.à.c.' }
      ],
      steps: [
        'Préparer le caramel avec sucre et beurre',
        'Couper les pommes en quartiers',
        'Disposer les pommes dans le moule',
        'Couvrir avec la pâte feuilletée',
        'Cuire 40 minutes à 180°C',
        'Démouler à chaud et servir'
      ],
      cookingTimeMinutes: 40,
      preparationTimeMinutes: 25,
      servings: 8
    },
    {
      title: 'Mousse au chocolat noir',
      slug: 'mousse-chocolat-noir',
      content: 'Une mousse au chocolat aérienne et intense, préparée avec du chocolat noir de qualité. Ce dessert français est à la fois simple et élégant. Le secret d\'une bonne mousse réside dans le chocolat utilisé (minimum 70% de cacao) et dans le délicat équilibre entre le chocolat fondu et les blancs d\'œufs montés en neige.',
      author: adminUser._id,
      categories: [categories[2]._id],
      tags: ['mousse', 'chocolat', 'dessert', 'français', 'sans farine'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 250,
      ingredients: [
        { name: 'Chocolat noir 70%', quantity: '200', unit: 'g' },
        { name: 'Œufs', quantity: '4', unit: 'pièces' },
        { name: 'Sucre', quantity: '50', unit: 'g' },
        { name: 'Crème fraîche', quantity: '20', unit: 'cl' },
        { name: 'Beurre', quantity: '30', unit: 'g' }
      ],
      steps: [
        'Faire fondre le chocolat au bain-marie',
        'Séparer les blancs des jaunes d\'œufs',
        'Ajouter les jaunes au chocolat fondu',
        'Monter les blancs en neige ferme',
        'Incorporer délicatement les blancs',
        'Réfrigérer au moins 4 heures'
      ],
      cookingTimeMinutes: 0,
      preparationTimeMinutes: 30,
      servings: 6
    },

    // Cuisine monde
    {
      title: 'Sushi maison facile',
      slug: 'sushi-maison-facile',
      content: 'Les sushis sont une spécialité japonaise qui peut être facilement préparée à la maison. Cette recette simplifiée vous permettra de créer des makis et des sushis de qualité restaurant. Le plus important est la qualité du riz et la fraîcheur du poisson. Une fois la technique maîtrisée, vous pourrez varier les plaisirs avec différents ingrédients.',
      author: adminUser._id,
      categories: [categories[3]._id],
      tags: ['sushi', 'japonais', 'riz', 'saumon', 'makis'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 180,
      ingredients: [
        { name: 'Riz à sushi', quantity: '300', unit: 'g' },
        { name: 'Saumon frais', quantity: '200', unit: 'g' },
        { name: 'Nori', quantity: '4', unit: 'feuilles' },
        { name: 'Vinaigre de riz', quantity: '3', unit: 'c.à.s.' },
        { name: 'Wasabi', quantity: '1', unit: 'tube' }
      ],
      steps: [
        'Cuire le riz et le laisser refroidir',
        'Préparer le vinaigre de riz',
        'Couper le saumon en lanières',
        'Étaler le riz sur la feuille nori',
        'Ajouter le saumon et rouler',
        'Couper en morceaux et servir'
      ],
      cookingTimeMinutes: 25,
      preparationTimeMinutes: 45,
      servings: 4
    },
    {
      title: 'Tagine d\'agneau aux pruneaux',
      slug: 'tagine-agneau-pruneaux',
      content: 'Le tagine d\'agneau aux pruneaux est un plat traditionnel marocain qui allie le salé et le sucré de manière exquise. La viande d\'agneau fondante mijote lentement avec des épices douces et des pruneaux juteux. Ce plat parfumé est parfait pour recevoir et impressionner vos invités avec des saveurs du Maghreb.',
      author: adminUser._id,
      categories: [categories[3]._id],
      tags: ['tagine', 'agneau', 'pruneaux', 'marocain', 'épices'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 220,
      ingredients: [
        { name: 'Épaule d\'agneau', quantity: '1,2', unit: 'kg' },
        { name: 'Pruneaux d\'Agen', quantity: '200', unit: 'g' },
        { name: 'Oignons', quantity: '3', unit: 'pièces' },
        { name: 'Cannelle', quantity: '2', unit: 'bâtonnets' },
        { name: 'Gingembre', quantity: '1', unit: 'morceau' }
      ],
      steps: [
        'Couper l\'agneau en morceaux',
        'Faire dorer les oignons',
        'Ajouter la viande et les épices',
        'Mouiller avec de l\'eau chaude',
        'Ajouter les pruneaux après 1h',
        'Laisser mijoter 2h30 au total'
      ],
      cookingTimeMinutes: 150,
      preparationTimeMinutes: 20,
      servings: 6
    },

    // Boissons
    {
      title: 'Smoothie mangue passion',
      slug: 'smoothie-mangue-passion',
      content: 'Un smoothie tropical exotique qui vous transportera instantanément vers des contrées ensoleillées. La douceur de la mangue associée à l\'acidité de la passion crée une boisson équilibrée et rafraîchissante. Parfait pour le petit-déjeuner ou comme en-cas sain dans la journée, ce smoothie est plein de vitamines et de saveurs.',
      author: adminUser._id,
      categories: [categories[4]._id],
      tags: ['smoothie', 'mangue', 'fruit de la passion', 'tropical', 'sain'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 140,
      ingredients: [
        { name: 'Mangue mûre', quantity: '2', unit: 'pièces' },
        { name: 'Fruits de la passion', quantity: '4', unit: 'pièces' },
        { name: 'Yaourt nature', quantity: '200', unit: 'g' },
        { name: 'Lait de coco', quantity: '100', unit: 'ml' },
        { name: 'Miel', quantity: '1', unit: 'c.à.s.' }
      ],
      steps: [
        'Éplucher et couper la mangue',
        'Extraire la pulpe des fruits de la passion',
        'Mettre tous les ingrédients dans le blender',
        'Mixer jusqu\'à obtenir une texture lisse',
        'Ajouter des glaçons si désiré',
        'Servir immédiatement bien frais'
      ],
      cookingTimeMinutes: 0,
      preparationTimeMinutes: 10,
      servings: 2
    },
    {
      title: 'Limonade menthe fraîche',
      slug: 'limonade-menthe-fraiche',
      content: 'Une limonade maison rafraîchissante avec de la menthe fraîche. Bien plus simple et naturelle que les limonades industrielles, cette boisson est parfaite pour étancher la soif en été. La combinaison du citron acidulé et de la menthe fraîche crée une boisson tonifiante et désaltérante qui plaira à tous.',
      author: adminUser._id,
      categories: [categories[4]._id],
      tags: ['limonade', 'menthe', 'citron', 'rafraîchissant', 'été'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 95,
      ingredients: [
        { name: 'Citrons jaunes', quantity: '4', unit: 'pièces' },
        { name: 'Menthe fraîche', quantity: '1', unit: 'botte' },
        { name: 'Sucre', quantity: '100', unit: 'g' },
        { name: 'Eau gazeuse', quantity: '1', unit: 'litre' },
        { name: 'Glaçons', quantity: '20', unit: 'cubes' }
      ],
      steps: [
        'Presser les citrons et filtrer le jus',
        'Préparer un sirop avec le sucre et l\'eau',
        'Laver et hacher la menthe',
        'Mélanger jus de citron et sirop',
        'Ajouter la menthe et refroidir',
        'Ajouter l\'eau gazeuse au moment de servir'
      ],
      cookingTimeMinutes: 5,
      preparationTimeMinutes: 15,
      servings: 6
    },

    // Végétarien
    {
      title: 'Curry de pois chiches',
      slug: 'curry-pois-chiches',
      content: 'Un curry végétarien riche en protéines et en saveurs. Les pois chiches absorbent parfaitement les épices et créent un plat réconfortant et nourrissant. Cette recette indienne est facile à préparer et peut être adaptée selon les légumes de saison. Servez-la avec du riz basmati pour un repas complet et équilibré.',
      author: adminUser._id,
      categories: [categories[5]._id],
      tags: ['curry', 'pois chiches', 'végétarien', 'indien', 'épices'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 165,
      ingredients: [
        { name: 'Pois chiches secs', quantity: '300', unit: 'g' },
        { name: 'Lait de coco', quantity: '400', unit: 'ml' },
        { name: 'Curry en poudre', quantity: '2', unit: 'c.à.s.' },
        { name: 'Tomates concassées', quantity: '400', unit: 'g' },
        { name: 'Épinards frais', quantity: '200', unit: 'g' }
      ],
      steps: [
        'Faire tremper les pois chiches une nuit',
        'Les cuire jusqu\'à ce qu\'ils soient tendres',
        'Faire revenir les épices dans l\'huile',
        'Ajouter les tomates et le lait de coco',
        'Incorporer les pois chiches cuits',
        'Ajouter les épinards en fin de cuisson'
      ],
      cookingTimeMinutes: 45,
      preparationTimeMinutes: 15,
      servings: 4
    },
    {
      title: 'Gratin dauphinois végétal',
      slug: 'gratin-dauphinois-végétal',
      content: 'Une version végétalienne du classique gratin dauphinois. Des pommes de terre finement tranchées mijotées dans une crème végétale parfumée à l\'ail et à la noix de muscade. Ce plat crémeux et réconfortant prouve que la cuisine végétalienne peut être aussi gourmande que la cuisine traditionnelle.',
      author: adminUser._id,
      categories: [categories[5]._id],
      tags: ['gratin', 'végétalien', 'pommes de terre', 'crémeux', 'français'],
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      viewsCount: 130,
      ingredients: [
        { name: 'Pommes de terre', quantity: '1,5', unit: 'kg' },
        { name: 'Crème d\'amande', quantity: '500', unit: 'ml' },
        { name: 'Ail', quantity: '3', unit: 'gousses' },
        { name: 'Noix de muscade', quantity: '1', unit: 'c.à.c.' },
        { name: 'Levure maltée', quantity: '50', unit: 'g' }
      ],
      steps: [
        'Éplucher et couper les pommes de terre en fines rondelles',
        'Préparer la crème avec ail et muscade',
        'Disposer les pommes de terre en couches',
        'Verser la crème entre chaque couche',
        'Saupoudrer de levure maltée',
        'Cuire 45 minutes à 180°C'
      ],
      cookingTimeMinutes: 45,
      preparationTimeMinutes: 20,
      servings: 6
    }
  ];

  const articles = await articleModel.insertMany(articlesData);
  console.log('Articles created:', articles.length);

  console.log('\n=== SEEDING COMPLETED ===');
  console.log('Categories:', categories.length);
  console.log('Articles:', articles.length);
  console.log('Admin user: admin@culinart.com / password123');
  console.log('All articles have status: PUBLISHED');
  
  await app.close();
}

bootstrap().catch(console.error);
