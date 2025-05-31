# ATLAS Conference Management System – Deployment Guide

---

## **User Preferences & Chat History Context**

This deployment guide is tailored for the following requirements and user preferences, as discussed in previous conversations:

- **Stack:** Node.js (Express), MongoDB, React (Vite), Tailwind CSS
- **Deployment Target:** Ubuntu 22.04 LTS VPS (4 vCPU, 8GB RAM, 100GB NVMe SSD, 8TB Bandwidth)
- **Database:** Local MongoDB (not Atlas, for cost reasons), but must be accessible remotely via MongoDB Compass
- **Security:** Strong focus on security (firewall, authentication, no public DB exposure)
- **Initial Data:** Must load initial admin/staff credentials and sample data
- **Project Structure:** Backend, DB, and frontend all on the same VPS
- **No codebase access for the AI assistant** (this file is the only reference)
- **User wants a step-by-step, foolproof process**

---

## **Project Directory Structure (Backend Example)**

```
server/
├── package.json
├── package-lock.json
├── README.md
├── nodemon.json
├── direct-start.js
├── pre-start.js
├── server-wrapper.js
├── fix-auth.js
├── uploads/
├── logs/
├── public/
├── scripts/
│   └── migrate_category_entitlements.js
└── src/
    ├── app.js
    ├── index.js
    ├── server.js
    ├── config/
    │   ├── config.js
    │   ├── database.js
    │   ├── logger.js
    │   └── roles.js
    ├── controllers/
    ├── docs/
    ├── middleware/
    ├── models/
    ├── public/
    ├── routes/
    ├── services/
    ├── utils/
    │   └── seedData.js
    ├── validations/
    └── validation/
```

---

## **2. Backend Deployment Progress**

### **A. System Preparation**
- Updated Ubuntu to 24.04 LTS.
- Ran:
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y build-essential curl git ufw
  ```
- **Status:** System and essential packages up to date.

### **B. Firewall Configuration**
- Opened required ports for SSH, HTTP, HTTPS, MongoDB, and Node.js backend:
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 3000/tcp
  sudo ufw allow 5000/tcp
  sudo ufw allow 27017/tcp
  sudo ufw enable
  sudo ufw reload
  sudo ufw status
  ```
- **Status:** Firewall active, all required ports open.

### **C. Node.js, npm, and PM2 Installation**
- Installed Node.js v18, npm, and PM2:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  sudo npm install -g pm2
  ```
- **Status:** Node.js, npm, and PM2 installed and working.

### **D. MongoDB Atlas Setup**
- Decided to use MongoDB Atlas (Free Tier) due to local CPU/AVX issues and for remote access.
- Created Atlas cluster and user.
- Verified connection from server using `mongosh`.
- Updated `.env` with Atlas connection string.
- **Status:** Atlas DB connection working.

### **E. Project Upload & Environment Configuration**
- Uploaded project zip to VPS and unzipped.
- Navigated to backend directory.
- Created and configured `.env` file for production (port 5000, Atlas URI, etc.).
- **Status:** Project files and environment ready.

### **F. Dependency Installation & Seeding**
- Ran:
  ```bash
  npm install
  # Ran seed scripts to initialize DB (fixed connection issues)
  ```
- **Status:** All dependencies installed, initial data seeded.

### **G. Image Processing Library (`sharp`) Troubleshooting**
- Encountered errors due to unsupported CPU (no AVX2) for latest `sharp`.
- Solution: Downgraded to `sharp@0.29.3` (last version with broad CPU support):
  ```bash
  npm uninstall sharp
  npm install sharp@0.29.3 --unsafe-perm
  pm2 restart atlas-backend
  ```
- **Note:** Documented in logs and here. If moving to a newer VPS, upgrade `sharp` for better performance.

### **H. Backend Launch & Health Check**
- Started backend with PM2:
  ```bash
  pm2 start src/server.js --name atlas-backend
  pm2 restart atlas-backend --update-env
  pm2 logs atlas-backend --lines 40
  ```
- Confirmed server running on port 5000 and health check endpoint is live.
- **Status:** Backend is up, connected to Atlas, and ready for API requests.

---

## **3. Next: Frontend Deployment**

- Prepare to build and serve the React frontend (Vite/Tailwind).
- Document all steps, configs, and troubleshooting as we proceed.

---

## **4. VPS Preparation**

### **A. Update and Upgrade System**
- The user logged into the VPS as root.
- Ran:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- System was updated successfully. (If any broken dependencies, use `sudo apt --fix-broken install`.)
- **Note:** The user changed the OS to **Ubuntu 24.04 LTS** (latest LTS version). All further steps are compatible with 24.04.

### **B. Install Essential Packages**
- Ran:
  ```bash
  sudo apt install -y build-essential curl git ufw
  ```
- This installed compilers, curl, git, and the Uncomplicated Firewall (ufw).
- **Status:** Essentials installed successfully on Ubuntu 24.04.

### **C. Set Up Firewall and Open Ports**
- Ran:
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 3000/tcp
  sudo ufw allow 27017/tcp
  sudo ufw enable
  ```
- **User Output:**
  - Rules updated
  - Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
  - Firewall is active and enabled on system startup
- **Note:**
  - **MongoDB (port 27017) is open to all IPs for initial setup and remote access (e.g., MongoDB Compass).**
  - This is NOT recommended for production. After setup, restrict this port to trusted IPs only for security.
- **Status:** Firewall is active, and all required ports are open.

### **D. Install Node.js, npm, and PM2**
- Ran:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  sudo npm install -g pm2
  ```
- **User Output:**
  - Node.js version: v18.20.8
  - npm version: 10.8.2
  - PM2 version: 6.0.6
  - PM2 started successfully and displayed its welcome banner.
- **Status:** Node.js, npm, and PM2 are installed and working on Ubuntu 24.04.

---

## **5. Install MongoDB (Community Edition)**

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
```

---

## **6. Secure MongoDB and Enable Remote Access**

### **A. Edit MongoDB Config**
```bash
sudo nano /etc/mongod.conf
```
- Change `bindIp: 127.0.0.1` to `bindIp: 0.0.0.0` to allow remote connections.
- Save and exit (Ctrl+O, Enter, Ctrl+X).

### **B. Restart MongoDB**
```bash
sudo systemctl restart mongod
```

### **C. Create Admin User**
```bash
mongo
```
```js
use admin
db.createUser({
  user: "atlasAdmin",
  pwd: "StrongPasswordHere",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})
exit
```

### **D. Enable Authentication**
- Edit `/etc/mongod.conf` again, add or uncomment:
  ```
  security:
    authorization: enabled
  ```
- Restart MongoDB:
  ```bash
  sudo systemctl restart mongod
  ```

### **E. Restrict Firewall for MongoDB**
- Allow only your office/home IP for port 27017:
  ```bash
  sudo ufw allow from <YOUR_IP> to any port 27017
  sudo ufw delete allow 27017/tcp  # Remove open access if previously set
  ```

---

## **7. Clone and Set Up the Project**

```bash
git clone <your-repo-url>
cd <project-root>/server
npm install
```

---

## **8. Environment Variables (.env)**

Create a `.env` file in the `server` directory with at least:
```
NODE_ENV=production
PORT=3000
MONGODB_URL=mongodb://atlasAdmin:StrongPasswordHere@localhost:27017/atlas_conference?authSource=admin
JWT_SECRET=YourSuperSecretKey
JWT_ACCESS_EXPIRATION_MINUTES=240
JWT_REFRESH_EXPIRATION_DAYS=30
EMAIL_FROM=noreply@your-domain.com
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-password
```
- Add AWS/Stripe keys if needed for your features.

---

## **9. Load Initial Credentials and Sample Data**

- The backend includes a seed script (`src/utils/seedData.js`) that creates initial admin/staff users and sample events/categories.
- This script is usually run automatically in non-production, but for production, run manually:

```bash
node
```
```js
const seed = require('./src/utils/seedData');
seed.seedDatabase().then(() => process.exit());
```
- **Default admin credentials:**
  - Email: `admin@example.com`
  - Password: `password123`
  - (Change these after first login!)

---

## **10. Start the Backend Server**

```bash
pm2 start src/server.js --name atlas-backend
pm2 save
```
- The API will be available at `http://<your-vps-ip>:3000/api`
- Health check: `http://<your-vps-ip>:3000/health`

---

## **11. Build and Serve the Frontend**

- Build your React app (from the frontend directory):
  ```bash
  npm install
  npm run build
  ```
- Serve the `dist/` folder with Nginx or Caddy, or use a simple static server:
  ```bash
  npm install -g serve
  serve -s dist -l 80
  ```

---

## **12. Access MongoDB Remotely (MongoDB Compass)**

- Use the VPS public IP and admin credentials:
  - Connection string: `mongodb://atlasAdmin:StrongPasswordHere@<your-vps-ip>:27017/atlas_conference?authSource=admin`
- Make sure your firewall only allows your IP for port 27017.

---

## **13. Security & Maintenance**
- Change all default passwords after first login.
- Keep your system and dependencies updated.
- Set up regular backups for MongoDB.
- Monitor logs (`logs/` directory, PM2, and system logs).
- Use HTTPS for frontend and API (set up Nginx/Caddy reverse proxy and Let's Encrypt).

---

## **14. Troubleshooting**
- Check `pm2 logs atlas-backend` for backend errors.
- Check `sudo systemctl status mongod` for MongoDB status.
- Use `mongo` shell for DB troubleshooting.
- If you can't connect with Compass, check firewall and MongoDB config.

---

## **15. Notes for AI Assistants**
- The user prefers explicit, step-by-step instructions and does not want assumptions.
- The backend project structure and seed scripts are as described above.
- The user may want to adjust CORS settings in `src/app.js` to match their frontend domain.
- The user expects all critical deployment, security, and initial credential steps to be covered.

---

## 16. Deployment Status

- Backend and frontend are now successfully deployed and accessible via Nginx.
- Nginx is configured to serve the React build from `/var/www/atlas-client` and proxy API requests to the backend on port 5000.
- Permissions and file locations have been set so Nginx can serve static files (no symlinks to `/root`).
- API base URL in the frontend must be set to `/api` for correct proxying.
- If you see a 500 error or Nginx welcome page, check:
  - Nginx config (`/etc/nginx/sites-available/atlas`)
  - File permissions in `/var/www/atlas-client`
  - That the build files are present and not symlinked to `/root`
  - Reload Nginx after any changes: `sudo systemctl reload nginx`

---

## 17. Updating the Deployment with New Features

### **A. Development Workflow**
1. **Develop and test new features locally.**
2. **Commit your changes to your local git repository.**
3. **Push your changes to your remote git repository (e.g., GitHub, GitLab).**
4. **On the server:**
   - Pull the latest code from your remote repository.
   - Rebuild the frontend if there are frontend changes.
   - Restart the backend if there are backend changes.
   - Copy the new frontend build to `/var/www/atlas-client`.
   - Reload Nginx if needed.

### **B. Example Update Commands (on the VPS)**
```bash
# 1. Pull latest code
cd ~/ONSITE\ ATLAS
# If you cloned from git:
git pull origin main

# 2. Backend changes
cd server
npm install
pm run seed   # If you need to reseed data
pm2 restart atlas-backend

# 3. Frontend changes
cd ../client
npm install
npm run build
sudo cp -r dist/* /var/www/atlas-client/

# 4. Reload Nginx (if config changed)
sudo nginx -t
sudo systemctl reload nginx
```

---

## 18. Using Git Locally

### **A. Initialize a Local Git Repository**
```bash
git init
git add .
git commit -m "Initial commit"
```

### **B. Add a Remote and Push**
```bash
git remote add origin <your-remote-repo-url>
git branch -M main
git push -u origin main
```

### **C. For Future Changes**
```bash
git add .
git commit -m "Describe your changes"
git push
```

---

## 19. Best Practices for Feature Development
- Always test new features locally before deploying to production.
- Use feature branches in git for larger changes.
- Keep your `.env` and sensitive files out of version control (add to `.gitignore`).
- Document any new environment variables or dependencies in the README and deployment guide.
- After deployment, test all critical workflows in production.

---

**End of Deployment Guide** 