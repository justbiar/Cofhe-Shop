<<<<<<< HEAD
# CofHE Shop



## 🎮 Özellikler


### Frontend
- **React + TypeScript**: Modern web geliştirme
- **Three.js + React Three Fiber**: 3D oyun grafikleri
- **Wagmi + RainbowKit**: Web3 bağlantısı
- **Framer Motion**: Animasyonlar
- **Styled Components**: Modern CSS

### Oyun Özellikleri
- 3D interaktif oyun dünyası
- NFT karakter sistemi
- Marketplace entegrasyonu
- Envanter yönetimi
- Blockchain tabanlı oyun mekanikleri

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Git

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd eth-game-scaffold
```

### 2. Bağımlılıkları Yükleyin
```bash
# Ana proje bağımlılıkları
npm install

# Smart contract bağımlılıkları
cd contracts
npm install

# Frontend bağımlılıkları
cd ../frontend
npm install
```

### 3. Environment Dosyasını Ayarlayın
```bash
cd contracts
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🎯 Kullanım

### Geliştirme Ortamı
```bash
# Ana dizinde (paralel çalıştırma)
npm run dev

# Veya ayrı ayrı
npm run dev:contracts  # Hardhat node
npm run dev:frontend   # React dev server
```

### Smart Contract Testleri
```bash
cd contracts
npm test
```

### Smart Contract Deploy
```bash
cd contracts

# Local network
npm run deploy

# Sepolia testnet
npm run deploy:testnet

# Mainnet
npm run deploy:mainnet
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 📁 Proje Yapısı

```
eth-game-scaffold/
├── contracts/                 # Smart contracts
│   ├── contracts/            # Solidity dosyaları
│   ├── scripts/              # Deploy scriptleri
│   ├── test/                 # Test dosyaları
│   ├── hardhat.config.js     # Hardhat konfigürasyonu
│   └── package.json
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React bileşenleri
│   │   ├── config/          # Wagmi konfigürasyonu
│   │   ├── contracts/       # Contract adresleri
│   │   └── main.tsx         # Ana uygulama
│   ├── public/
│   └── package.json
└── package.json              # Ana proje
```

## 🎮 Oyun Mekanikleri

### Karakter Sistemi
- NFT tabanlı karakterler
- Seviye ve güç sistemi
- Nadirlik seviyeleri (1-5 yıldız)
- Karakter türleri (Warrior, Mage, Ranger, vb.)

### Ekonomi
- ERC20 token tabanlı oyun parası
- NFT alım-satım marketplace'i
- Oyun içi ödüller

### 3D Dünya
- Three.js ile interaktif 3D sahne
- Kamera kontrolleri
- Obje etkileşimleri
- Gerçek zamanlı animasyonlar

## 🔧 Geliştirme

### Yeni Smart Contract Ekleme
1. `contracts/contracts/` dizinine yeni `.sol` dosyası ekleyin
2. `contracts/scripts/deploy.js` dosyasını güncelleyin
3. Test dosyası oluşturun

### Yeni Frontend Bileşeni
1. `frontend/src/components/` dizinine yeni bileşen ekleyin
2. Gerekirse routing ekleyin
3. Styled components kullanın

### 3D Obje Ekleme
1. `frontend/src/components/GameWorld.tsx` dosyasını düzenleyin
2. Three.js geometrileri kullanın
3. Material ve animasyon ekleyin

## 🌐 Ağ Konfigürasyonu

### Local Development
- Hardhat local network: `http://localhost:8545`
- Chain ID: `31337`

### Testnet (Sepolia)
- RPC URL: Sepolia Infura/Alchemy
- Chain ID: `11155111`

### Mainnet
- RPC URL: Ethereum Mainnet
- Chain ID: `1`

## 🎨 Tasarım Sistemi

### Renk Paleti
- Ana gradient: `#667eea` → `#764ba2`
- Nadirlik renkleri:
  - Common: `#ff6b6b`
  - Uncommon: `#4ecdc4`
  - Rare: `#45b7d1`
  - Epic: `#96ceb4`
  - Legendary: `#feca57`

### Tipografi
- Font: Inter
- Başlık: 3rem, gradient text
- Body: 1rem, rgba opacity

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# dist/ klasörünü deploy edin
```

### Smart Contracts
```bash
cd contracts
npm run deploy:mainnet
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Sorularınız için:
- GitHub Issues açın
- Discord: [Sunucu linki]
- Email: [İletişim emaili]

## 🔮 Gelecek Özellikler

- [ ] Multiplayer desteği
- [ ] Daha fazla karakter türü
- [ ] Oyun içi görev sistemi
- [ ] Guild/Clan sistemi
- [ ] Mobile uygulama
- [ ] VR desteği
- [ ] AI tabanlı NPC'ler

---

**Not**: Bu scaffold geliştirme amaçlıdır. Ana ağa deploy etmeden önce güvenlik denetimi yapın.


=======
# Cofhe-Shop
>>>>>>> 14e2e32fddc15d92fbd25b2db48525689d31e6c6
