# YouTube Satış API Dokümantasyonu

## 📋 İçindekiler
- [Genel Bilgiler](#genel-bilgiler)
- [Kimlik Doğrulama](#kimlik-doğrulama)
- [Hata Kodları](#hata-kodları)
- [Kimlik Doğrulama Endpoint'leri](#kimlik-doğrulama-endpointleri)
- [Servis Endpoint'leri](#servis-endpointleri)
- [Ürün Endpoint'leri](#ürün-endpointleri)
- [Sipariş Endpoint'leri](#sipariş-endpointleri)
- [Yorum Endpoint'leri](#yorum-endpointleri)
- [Ödeme Endpoint'leri](#ödeme-endpointleri)

## 🌐 Genel Bilgiler

### Base URL
```
http://localhost:3001/api
```

### Content-Type
Tüm istekler için:
```
Content-Type: application/json
```

### Yanıt Formatı
Tüm API yanıtları aşağıdaki formatta döner:

**Başarılı Yanıt:**
```json
{
  "success": true,
  "message": "İşlem başarılı",
  "data": {
    // Veri burada
  }
}
```

**Hata Yanıtı:**
```json
{
  "success": false,
  "message": "Hata mesajı",
  "errors": [
    // Validasyon hataları (varsa)
  ]
}
```

## 🔐 Kimlik Doğrulama

API, JWT (JSON Web Token) tabanlı kimlik doğrulama kullanır.

### Authorization Header
Korumalı endpoint'ler için:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Roller
- **user**: Normal kullanıcı
- **admin**: Yönetici

## ❌ Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Yetkisiz erişim |
| 403 | Yasak |
| 404 | Bulunamadı |
| 500 | Sunucu hatası |

---

## 🔑 Kimlik Doğrulama Endpoint'leri

### 1. Kullanıcı Kaydı

**POST** `/auth/register`

**İstek:**
```json
{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "123456"
}
```

**Başarılı Yanıt (201):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Hata Senaryoları:**
- Email zaten kayıtlı (400)
- Geçersiz email formatı (400)
- Şifre çok kısa (400)

### 2. Kullanıcı Girişi

**POST** `/auth/login`

**İstek:**
```json
{
  "email": "ahmet@example.com",
  "password": "123456"
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Hata Senaryoları:**
- Geçersiz email/şifre (401)
- Kullanıcı bulunamadı (401)

### 3. Mevcut Kullanıcı Bilgisi

**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com",
      "role": "user",
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  }
}
```

### 4. Profil Güncelleme

**PUT** `/auth/profile`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**İstek:**
```json
{
  "name": "Ahmet Yılmaz Güncellendi",
  "email": "yeni@example.com"
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Profil başarıyla güncellendi",
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Ahmet Yılmaz Güncellendi",
      "email": "yeni@example.com",
      "role": "user"
    }
  }
}
```

---

## 🛍️ Servis Endpoint'leri

### 1. Tüm Servisleri Listele

**GET** `/services`

**Query Parametreleri:**
- `page` (opsiyonel): Sayfa numarası (varsayılan: 1)
- `limit` (opsiyonel): Sayfa başına öğe sayısı (varsayılan: 10)
- `popular` (opsiyonel): Sadece popüler servisleri getir (true/false)

**Örnek İstek:**
```
GET /services?page=1&limit=5&popular=true
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "YouTube İzlenme",
        "description": "YouTube videolarınız için izlenme satın alın",
        "slug": "youtube-izlenme",
        "tags": ["youtube", "izlenme", "video"],
        "isActive": true,
        "isPopular": true,
        "sortOrder": 1,
        "commentCount": 15,
        "createdAt": "2023-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalServices": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Tek Servis Detayı

**GET** `/services/:identifier`

**Parametreler:**
- `identifier`: Servis ID'si veya slug'ı

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "service": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "YouTube İzlenme",
      "description": "YouTube videolarınız için izlenme satın alın",
      "slug": "youtube-izlenme",
      "tags": ["youtube", "izlenme", "video"],
      "isActive": true,
      "isPopular": true,
      "sortOrder": 1,
      "commentCount": 15,
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  }
}
```

### 3. Popüler Servisleri Listele

**GET** `/services/popular/list`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "YouTube İzlenme",
        "description": "YouTube videolarınız için izlenme satın alın",
        "slug": "youtube-izlenme",
        "commentCount": 15
      }
    ]
  }
}
```

---

## 📦 Ürün Endpoint'leri

### 1. Tüm Ürünleri Listele

**GET** `/products`

**Query Parametreleri:**
- `page` (opsiyonel): Sayfa numarası
- `limit` (opsiyonel): Sayfa başına öğe sayısı
- `service` (opsiyonel): Servis ID'si ile filtrele
- `minPrice` (opsiyonel): Minimum fiyat
- `maxPrice` (opsiyonel): Maksimum fiyat
- `minQuantity` (opsiyonel): Minimum miktar
- `maxQuantity` (opsiyonel): Maksimum miktar

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "1000 YouTube İzlenme",
        "description": "1000 adet gerçek YouTube izlenme",
        "service": {
          "_id": "64a1b2c3d4e5f6789012345",
          "name": "YouTube İzlenme"
        },
        "quantity": 1000,
        "price": 25.99,
        "currency": "₺",
        "deliveryTime": "24 saat",
        "features": ["Gerçek kullanıcılar", "Hızlı teslimat"],
        "isActive": true,
        "isPopular": false,
        "createdAt": "2023-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Tek Ürün Detayı

**GET** `/products/:id`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "64a1b2c3d4e5f6789012346",
      "name": "1000 YouTube İzlenme",
      "description": "1000 adet gerçek YouTube izlenme",
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "YouTube İzlenme",
        "description": "YouTube videolarınız için izlenme satın alın"
      },
      "quantity": 1000,
      "price": 25.99,
      "currency": "₺",
      "targetAudience": "turkey",
      "deliveryTime": "24 saat",
      "features": ["Gerçek kullanıcılar", "Hızlı teslimat"],
      "isActive": true,
      "isPopular": false,
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  }
}
```

### 3. Servise Göre Ürünleri Listele

**GET** `/products/service/:serviceId`

**Query Parametreleri:**
- `page`, `limit`, `targetAudience` (yukarıdaki gibi)

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      // Ürün listesi
    ],
    "pagination": {
      // Sayfalama bilgisi
    }
  }
}
```

### 4. Popüler Ürünleri Listele

**GET** `/products/popular/list`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      // Popüler ürünler
    ]
  }
}
```

---

## 🛒 Sipariş Endpoint'leri

### 1. Sipariş Oluştur

**POST** `/orders`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**İstek:**
```json
{
  "productId": "64a1b2c3d4e5f6789012346",
  "processLink": "https://youtube.com/watch?v=abc123",
  "customerDetails": {
    "fullName": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "phone": "+905551234567"
  },
  "paymentMethod": "crypto_dodo",
  "couponCode": "INDIRIM10"
}
```

**Başarılı Yanıt (201):**
```json
{
  "success": true,
  "message": "Sipariş başarıyla oluşturuldu",
  "data": {
    "order": {
      "_id": "64a1b2c3d4e5f6789012347",
      "orderNumber": "ORD-1690876800000-0001",
      "user": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Ahmet Yılmaz",
        "email": "ahmet@example.com"
      },
      "product": {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "1000 YouTube İzlenme",
        "quantity": 1000,
        "price": 25.99,
        "currency": "₺"
      },
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "YouTube İzlenme",
        "description": "YouTube videolarınız için izlenme satın alın"
      },
      "processLink": "https://youtube.com/watch?v=abc123",
      "customerDetails": {
        "fullName": "Ahmet Yılmaz",
        "email": "ahmet@example.com",
        "phone": "+905551234567"
      },
      "pricing": {
        "originalPrice": 25.99,
        "discountAmount": 2.60,
        "finalPrice": 23.39,
        "currency": "₺"
      },
      "coupon": {
        "code": "INDIRIM10",
        "discountType": "percentage",
        "discountValue": 10
      },
      "payment": {
        "method": "crypto_dodo",
        "status": "pending"
      },
      "status": "pending",
      "processing": {
        "progress": 0
      },
      "timestamps": {
        "ordered": "2023-07-01T10:00:00.000Z"
      },
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  }
}
```

### 2. Kullanıcı Siparişlerini Listele

**GET** `/orders`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parametreleri:**
- `page` (opsiyonel): Sayfa numarası
- `limit` (opsiyonel): Sayfa başına öğe sayısı (max: 50)
- `status` (opsiyonel): Sipariş durumu

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "64a1b2c3d4e5f6789012347",
        "orderNumber": "ORD-1690876800000-0001",
        "product": {
          "name": "1000 YouTube İzlenme",
          "quantity": 1000,
          "price": 25.99,
          "currency": "₺"
        },
        "service": {
          "name": "YouTube İzlenme",
          "description": "YouTube videolarınız için izlenme satın alın"
        },
        "pricing": {
          "finalPrice": 23.39,
          "currency": "₺"
        },
        "status": "pending",
        "payment": {
          "status": "pending"
        },
        "createdAt": "2023-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalOrders": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Tek Sipariş Detayı

**GET** `/orders/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      // Tam sipariş detayları (yukarıdaki gibi)
    }
  }
}
```

### 4. Sipariş Sorgula (Herkese Açık)

**POST** `/orders/query`

**İstek:**
```json
{
  "orderNumber": "ORD-1690876800000-0001"
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Sipariş bulundu",
  "messageEn": "Order found",
  "data": {
    "order": {
      "orderNumber": "ORD-1690876800000-0001",
      "status": "in_progress",
      "paymentStatus": "completed",
      "service": {
        "name": "YouTube İzlenme",
        "description": "YouTube videolarınız için izlenme satın alın"
      },
      "product": {
        "name": "1000 YouTube İzlenme",
        "quantity": 1000
      },
      "pricing": {
        "finalPrice": 23.39,
        "currency": "₺"
      },
      "processLink": "https://youtube.com/watch?v=abc123",
      "processing": {
        "progress": 75,
        "startedAt": "2023-07-01T11:00:00.000Z"
      },
      "timestamps": {
        "ordered": "2023-07-01T10:00:00.000Z",
        "paid": "2023-07-01T10:30:00.000Z",
        "started": "2023-07-01T11:00:00.000Z"
      },
      "createdAt": "2023-07-01T10:00:00.000Z",
      "updatedAt": "2023-07-01T12:00:00.000Z"
    }
  }
}
```

### 5. Sipariş Takibi (Herkese Açık)

**GET** `/orders/track/:orderNumber`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "orderNumber": "ORD-1690876800000-0001",
      "status": "in_progress",
      "paymentStatus": "completed",
      "service": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "YouTube İzlenme"
      },
      "product": {
        "_id": "64a1b2c3d4e5f6789012346",
        "name": "1000 YouTube İzlenme",
        "quantity": 1000
      },
      "processLink": "https://youtube.com/watch?v=abc123",
      "progress": 75
    },
    "timeline": [
      {
        "status": "ordered",
        "title": "Sipariş Alındı",
        "titleEn": "Order Placed",
        "description": "Siparişiniz başarıyla alındı",
        "descriptionEn": "Your order has been successfully placed",
        "timestamp": "2023-07-01T10:00:00.000Z",
        "completed": true
      },
      {
        "status": "paid",
        "title": "Ödeme Alındı",
        "titleEn": "Payment Received",
        "description": "Ödemeniz başarıyla alındı",
        "descriptionEn": "Your payment has been successfully received",
        "timestamp": "2023-07-01T10:30:00.000Z",
        "completed": true
      },
      {
        "status": "processing",
        "title": "İşleme Alındı",
        "titleEn": "Processing Started",
        "description": "İşlem başladı (75% tamamlandı)",
        "descriptionEn": "Processing started (75% completed)",
        "timestamp": "2023-07-01T11:00:00.000Z",
        "completed": false
      }
    ]
  }
}
```

### 6. Kupon Doğrula

**POST** `/orders/validate-coupon`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**İstek:**
```json
{
  "couponCode": "INDIRIM10",
  "productId": "64a1b2c3d4e5f6789012346"
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Kupon geçerli",
  "data": {
    "coupon": {
      "code": "INDIRIM10",
      "name": "10% İndirim",
      "discountType": "percentage",
      "discountValue": 10
    },
    "discount": {
      "originalPrice": 25.99,
      "discountAmount": 2.60,
      "finalPrice": 23.39,
      "currency": "₺"
    }
  }
}
```

---

## 💬 Yorum Endpoint'leri

### 1. Servise Yorum Yap

**POST** `/comments`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**İstek:**
```json
{
  "content": "Bu servis gerçekten harika! Çok memnun kaldım.",
  "service": "64a1b2c3d4e5f6789012345",
  "parentComment": "64a1b2c3d4e5f6789012348"
}
```

**Başarılı Yanıt (201):**
```json
{
  "success": true,
  "message": "Yorum başarıyla eklendi",
  "data": {
    "comment": {
      "_id": "64a1b2c3d4e5f6789012349",
      "content": "Bu servis gerçekten harika! Çok memnun kaldım.",
      "user": {
        "_id": "64a1b2c3d4e5f6789012345",
        "name": "Ahmet Yılmaz"
      },
      "service": "64a1b2c3d4e5f6789012345",
      "parentComment": "64a1b2c3d4e5f6789012348",
      "likes": [],
      "likeCount": 0,
      "replies": [],
      "replyCount": 0,
      "createdAt": "2023-07-01T10:00:00.000Z"
    }
  }
}
```

### 2. Servis Yorumlarını Listele

**GET** `/comments/service/:serviceId`

**Query Parametreleri:**
- `page` (opsiyonel): Sayfa numarası
- `limit` (opsiyonel): Sayfa başına öğe sayısı (max: 50)

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id": "64a1b2c3d4e5f6789012349",
        "content": "Bu servis gerçekten harika! Çok memnun kaldım.",
        "user": {
          "_id": "64a1b2c3d4e5f6789012345",
          "name": "Ahmet Yılmaz"
        },
        "service": "64a1b2c3d4e5f6789012345",
        "parentComment": null,
        "likes": ["64a1b2c3d4e5f6789012345"],
        "likeCount": 1,
        "replies": [
          {
            "_id": "64a1b2c3d4e5f678901234a",
            "content": "Teşekkürler! Biz de sizin memnuniyetinizden mutluyuz.",
            "user": {
              "name": "Admin"
            },
            "likeCount": 0,
            "createdAt": "2023-07-01T11:00:00.000Z"
          }
        ],
        "replyCount": 1,
        "createdAt": "2023-07-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalComments": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 3. Tek Yorum Detayı

**GET** `/comments/:id`

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "comment": {
      // Tam yorum detayları
    }
  }
}
```

### 4. Yorumu Beğen/Beğenmekten Vazgeç

**POST** `/comments/:id/like`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Yorum beğenildi",
  "data": {
    "comment": {
      "_id": "64a1b2c3d4e5f6789012349",
      "likeCount": 2,
      "isLikedByUser": true
    }
  }
}
```

### 5. Yorumu Güncelle

**PUT** `/comments/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**İstek:**
```json
{
  "content": "Güncellenmiş yorum içeriği"
}
```

### 6. Yorumu Sil

**DELETE** `/comments/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Yorum başarıyla silindi"
}
```

---

## 💳 Ödeme Endpoint'leri

### 1. Ödeme İşle

**POST** `/payments/process/:orderId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Ödeme işlemi başlatıldı",
  "data": {
    "paymentUrl": "https://payment-provider.com/pay/abc123",
    "paymentId": "pay_abc123",
    "expiresAt": "2023-07-01T11:00:00.000Z"
  }
}
```

### 2. Ödeme Durumu Sorgula

**GET** `/payments/status/:orderId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "paymentStatus": "completed",
    "transactionId": "txn_abc123",
    "paidAt": "2023-07-01T10:30:00.000Z",
    "amount": 23.39,
    "currency": "₺"
  }
}
```

---

## 📝 Önemli Notlar

### Sipariş Durumları
- `pending`: Beklemede
- `processing`: İşleniyor
- `in_progress`: Devam ediyor
- `completed`: Tamamlandı
- `cancelled`: İptal edildi
- `refunded`: İade edildi

### Ödeme Durumları
- `pending`: Beklemede
- `processing`: İşleniyor
- `completed`: Tamamlandı
- `failed`: Başarısız
- `cancelled`: İptal edildi
- `refunded`: İade edildi

### Ödeme Yöntemleri
- `crypto_dodo`: DodoPayments kripto ödeme
- `crypto_coinbase`: Coinbase Commerce
- `credit_card`: Kredi kartı
- `bank_transfer`: Banka havalesi


### Rate Limiting
API'de rate limiting uygulanmıştır:
- Genel endpoint'ler: 100 istek/dakika
- Ödeme endpoint'leri: 10 istek/dakika

### Güvenlik
- Tüm şifreler bcrypt ile hashlenir
- JWT token'lar 7 gün geçerlidir
- CORS politikaları uygulanmıştır
- Input validasyonu tüm endpoint'lerde mevcuttur

### Test Bilgileri
- Admin hesabı: `admin@youtube-satis.com` / `admin123`
- Test sunucusu: `http://localhost:3001`
- Test komutları: `npm test`