# 🏛️ Auction Palace

Une plateforme d'enchères moderne et interactive construite avec Next.js, Supabase et Stripe.

## ✨ Fonctionnalités

- 🎯 **Enchères en temps réel** - Suivez les enchères en direct
- 💳 **Paiements sécurisés** - Intégration Stripe pour les transactions
- 🔐 **Authentification** - Système d'authentification complet avec Supabase
- 👤 **Profils utilisateurs** - Gestion des profils et vérification
- 🛡️ **Administration** - Panel d'administration
- 📱 **Interface responsive** - Design moderne et adaptatif
- ⚡ **Performance optimisée** - Construit avec Next.js 15 et Turbopack

## 🚀 Installation

### Prérequis

- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/) ou [pnpm](https://pnpm.io/)
- Compte [Supabase](https://supabase.com/)
- Compte [Stripe](https://stripe.com/)

### 1. Cloner le projet

```bash
git clone https://github.com/amine-asfar/Auction-palace
cd Auction-palace
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet et ajoutez les variables suivantes :

```env
# Supabase Configuration
NEXT_SUPABASE_SERVICE_KEY=your_supabase_service_role_key
NEXT_SUPABASE_JWT_SECRET=your_supabase_jwt_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

#### 🔧 Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com/)
2. Allez dans **Settings > API** dans votre dashboard Supabase
3. Copiez les valeurs suivantes :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `NEXT_SUPABASE_SERVICE_KEY`
   - **JWT Secret** → `NEXT_SUPABASE_JWT_SECRET`

#### 💳 Configuration Stripe

1. Créez un compte sur [Stripe](https://stripe.com/)
2. Allez dans **Developers > API keys**
3. Copiez les clés suivantes :
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### 4. Lancer le serveur de développement

```bash
npm run dev


Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir l'application.
