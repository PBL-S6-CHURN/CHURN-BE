## 🚀 **Quick Start**

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# 3. Setup database
npm run db:setup

# 4. Start server
npm run start:dev
```

### **Quick Database Setup:**

```bash
# Pastikan PostgreSQL running
# Buat database: db_name
# Edit .env dengan kredensial database
npm run db:setup
```

## 📡 **API Endpoints**

### **Engine Management**

```
GET    /customers                        - Get all customers
GET    /customers/type/:type             - Get customers by type
GET    /customers/risk/:risk             - Get customers by risk
GET    /customers/stats                  - Get stats by type
GET    /customers/search                 - Search customers by name
GET    /customers/:id                    - Get customers by ID
POST   /customers                        - Add data customers
POST   /customers/upload                 - Add data customers by upload excell
```

### **Auth Management**

```
POST    /register           - Register account
POST    /login              - Login account
GET     /profile            - Check profile
DELETE  /logout             - Logout account
PUT     /update-profile     - Update profile
PUT     /change-password    - Update password
```

### **Summarize Management**

```
GET    /summarize               - Get all data summarize data 
GET    /summarize/ratings       - Get positive & negative ratings
GET    /summarize/sentiment     - Just get summarize data
```

### **ALERT Management**

```
Please check the ALERT_API_DOCS.md files
```

## 📦 **Scripts**

| Command                | Description                 |
| ---------------------- | --------------------------- |
| `npm start`            | Start production server     |
| `npm run start:dev`    | Start development server    |
| `npm run migrate:up`   | Run migrations              |
| `npm run migrate:down` | Rollback migrations         |

## 🔧 **Development**

### **Environment Variables**

```env
Please check on .env.example files
```
