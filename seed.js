const mongoose = require('mongoose');
const Service = require('./models/Service');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const sampleServices = [
  {
    name: 'YouTube İzlenme',
    description: 'YouTube videolarınız için organik ve güvenli izlenme artışı hizmetleri. Farklı hedef kitle seçenekleri ile videolarınızın erişimini artırın.',
    tags: ['youtube', 'izlenme', 'video', 'organik'],
    isPopular: true,
    sortOrder: 1
  },
  {
    name: 'YouTube Beğeni',
    description: 'YouTube videolarınız için organik beğeni artışı hizmetleri. Videolarınızın etkileşim oranını artırarak daha fazla kişiye ulaşmasını sağlayın.',
    tags: ['youtube', 'beğeni', 'like', 'etkileşim'],
    isPopular: true,
    sortOrder: 2
  },
  {
    name: 'YouTube Abone',
    description: 'YouTube kanalınız için organik abone artışı hizmetleri. Kanalınızın büyümesini hızlandırın ve daha geniş bir kitleye ulaşın.',
    tags: ['youtube', 'abone', 'subscriber', 'kanal'],
    isPopular: false,
    sortOrder: 3
  },
  {
    name: 'YouTube Yorum',
    description: 'YouTube videolarınız için organik yorum artışı hizmetleri. Videolarınızın etkileşim oranını artırın ve algoritma performansını iyileştirin.',
    tags: ['youtube', 'yorum', 'comment', 'etkileşim'],
    isPopular: false,
    sortOrder: 4
  }
];

const sampleAdmin = {
  name: 'Admin User',
  email: 'admin@youtube-satis.com',
  password: 'admin123',
  role: 'admin'
};

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-satis');
    console.log('Connected to MongoDB');

    // Drop the database to remove all indexes and data
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped');

    // Create admin user
    const admin = new User(sampleAdmin);
    await admin.save();
    console.log('Admin user created');

    // Create sample services
    const createdServices = await Service.insertMany(sampleServices);
    console.log('Sample services created');

    // Create sample products for each service
    const sampleProducts = [];

    // YouTube İzlenme products
    const youtubeViewsService = createdServices.find(s => s.name === 'YouTube İzlenme');
    sampleProducts.push(
      {
        name: '10.000 İzlenme',
        description: 'YouTube videolarınız için 10.000 organik izlenme paketi.',
        service: youtubeViewsService._id,
        quantity: 10000,
        price: 850.00,
        currency: '₺',
        deliveryTime: '24-48 saat',
        features: [
          'Organik izlenme',
          'Güvenli artış',
          'Global hedef kitle',
          'Hızlı başlangıç'
        ],
        isPopular: true
      },
      {
        name: '50.000 İzlenme',
        description: 'YouTube videolarınız için 50.000 organik izlenme paketi.',
        service: youtubeViewsService._id,
        quantity: 50000,
        price: 2750.00,
        currency: '₺',
        deliveryTime: '24-48 saat',
        features: [
          'Organik izlenme',
          'Güvenli artış',
          'Global hedef kitle',
          '7/24 destek'
        ],
        isPopular: true
      },
      {
        name: '100.000 Türk İzlenme',
        description: 'YouTube videolarınız için 100.000 Türk izlenme paketi.',
        service: youtubeViewsService._id,
        quantity: 100000,
        price: 4500.00,
        currency: '₺',
        deliveryTime: '12-24 saat',
        features: [
          'Türk hedef kitle',
          'Yüksek etkileşim',
          'Hızlı teslimat',
          'Kaliteli izleyici'
        ],
        isPopular: true
      },
      {
        name: '25.000 Premium İzlenme',
        description: 'YouTube videolarınız için 25.000 premium izlenme paketi.',
        service: youtubeViewsService._id,
        quantity: 25000,
        price: 1850.00,
        currency: '₺',
        deliveryTime: '6-12 saat',
        features: [
          'Premium kalite',
          'Hızlı teslimat',
          'Yüksek retention',
          'Garantili servis'
        ]
      }
    );

    // YouTube Beğeni products
    const youtubeLikesService = createdServices.find(s => s.name === 'YouTube Beğeni');
    sampleProducts.push(
      {
        name: '1.000 Beğeni',
        description: 'YouTube videolarınız için 1.000 organik beğeni paketi.',
        service: youtubeLikesService._id,
        quantity: 1000,
        price: 250.00,
        currency: '₺',
        deliveryTime: '12-24 saat',
        features: [
          'Organik beğeni',
          'Hızlı teslimat',
          'Güvenli işlem',
          'Kalıcı sonuçlar'
        ]
      },
      {
        name: '5.000 Beğeni',
        description: 'YouTube videolarınız için 5.000 organik beğeni paketi.',
        service: youtubeLikesService._id,
        quantity: 5000,
        price: 850.00,
        currency: '₺',
        deliveryTime: '24-48 saat',
        features: [
          'Organik beğeni',
          'Güvenli artış',
          'Kalıcı etkiler',
          'Hızlı başlangıç'
        ],
        isPopular: true
      }
    );

    // YouTube Abone products
    const youtubeSubsService = createdServices.find(s => s.name === 'YouTube Abone');
    sampleProducts.push(
      {
        name: '1.000 Abone',
        description: 'YouTube kanalınız için 1.000 organik abone paketi.',
        service: youtubeSubsService._id,
        quantity: 1000,
        price: 750.00,
        currency: '₺',
        deliveryTime: '48-72 saat',
        features: [
          'Organik aboneler',
          'Kaliteli profiller',
          'Uzun vadeli etki',
          'Güvenli artış'
        ]
      },
      {
        name: '5.000 Abone',
        description: 'YouTube kanalınız için 5.000 organik abone paketi.',
        service: youtubeSubsService._id,
        quantity: 5000,
        price: 2250.00,
        currency: '₺',
        deliveryTime: '48-72 saat',
        features: [
          'Kaliteli aboneler',
          'Organik büyüme',
          'Uzun vadeli etki',
          'Güvenli artış'
        ]
      }
    );

    // YouTube Yorum products
    const youtubeCommentsService = createdServices.find(s => s.name === 'YouTube Yorum');
    sampleProducts.push(
      {
        name: '50 Yorum',
        description: 'YouTube videolarınız için 50 organik yorum paketi.',
        service: youtubeCommentsService._id,
        quantity: 50,
        price: 350.00,
        currency: '₺',
        deliveryTime: '24-48 saat',
        features: [
          'Organik yorumlar',
          'Kaliteli içerik',
          'Etkileşim artışı',
          'Algoritma desteği'
        ]
      },
      {
        name: '200 Yorum',
        description: 'YouTube videolarınız için 200 organik yorum paketi.',
        service: youtubeCommentsService._id,
        quantity: 200,
        price: 950.00,
        currency: '₺',
        deliveryTime: '48-72 saat',
        features: [
          'Organik yorum artışı',
          'Kaliteli yorumlar',
          'Etkileşim artışı',
          'Algoritma desteği'
        ]
      }
    );

    // Create all products
    await Product.insertMany(sampleProducts);
    console.log('Sample products created');

    console.log('Database seeded successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@youtube-satis.com');
    console.log('Password: admin123');
    console.log('\nServices created:', createdServices.length);
    console.log('Products created:', sampleProducts.length);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();