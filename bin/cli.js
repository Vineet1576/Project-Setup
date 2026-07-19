#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const inquirer = require("inquirer");
const { execSync } = require("child_process");

const projectName = process.argv[2];
if (!projectName) {
  console.error("Usage: create-project <project-name>");
  process.exit(1);
}

const targetPath = path.resolve(process.cwd(), projectName);
const apiTemplatePath = path.resolve(__dirname, "..", "api");
const frontendTemplatePath = path.resolve(__dirname, "..", "frontend");
const adminTemplatePath = path.resolve(__dirname, "..", "admin");

if (fs.existsSync(targetPath)) {
  console.error(`Error: Directory "${projectName}" already exists.`);
  process.exit(1);
}

console.log(`\n\x1b[36mCreating project: ${projectName}\x1b[0m\n`);

function generateSecretKey() {
  return crypto.randomBytes(16).toString("hex");
}

function addEnginesToPackageJson(pkgPath, version) {
  const pkgFile = path.join(pkgPath, "package.json");
  if (!fs.existsSync(pkgFile)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  pkg.engines = { node: `>=${version}.0.0` };
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function generateEncryptionIv() {
  return crypto.randomBytes(16).toString("hex");
}

async function main() {
  const { platform } = await inquirer.prompt([
    {
      type: "list",
      name: "platform",
      message: "Select a platform to create:",
      choices: [
        { name: "API (Backend)", value: "api" },
        { name: "Frontend (React + Vite)", value: "frontend" },
        { name: "Admin Panel (React + Vite)", value: "admin" },
      ],
    },
  ]);

  const createApi = platform === "api";
  const createFrontend = platform === "frontend";
  const createAdmin = platform === "admin";

  const { nodeVersion } = await inquirer.prompt([
    {
      type: "list",
      name: "nodeVersion",
      message: "Select Node.js version for this project:",
      choices: [
        { name: "Node 18.x", value: "18" },
        { name: "Node 20.x (LTS)", value: "20" },
        { name: "Node 22.x", value: "22" },
        { name: "Custom", value: "custom" },
      ],
    },
  ]);

  let finalNodeVersion = nodeVersion;
  if (nodeVersion === "custom") {
    const { custom } = await inquirer.prompt([
      {
        type: "input",
        name: "custom",
        message: "Enter Node.js version (e.g. 20, 20.11, 22.3):",
        default: "20",
      },
    ]);
    finalNodeVersion = custom;
  }

  let apiEnvContent = "";
  let frontendEnvContent = "";
  let adminEnvContent = "";

  if (createApi) {
    const { createEnv } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createEnv",
        message: "Do you want to create a .env file?",
        default: true,
      },
    ]);

    if (createEnv) {
      const { useCryptoSecure } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useCryptoSecure",
          message: "Use crypto-secure encryption (RSA+AES-GCM)?",
          default: false,
        },
      ]);

      console.log("\n\x1b[33m  Enter your API configuration values:\x1b[0m\n");

      const answers = await inquirer.prompt([
        { name: "PORT", message: "PORT", default: "3000" },
        { name: "DB_USER", message: "DB_USER", default: "jc_OpEnEsEaT_DB" },
        {
          name: "DB_PASSWORD",
          message: "DB_PASSWORD",
          default: "jC02SeAt03oOp0eN26AtT",
        },
        { name: "HOST", message: "HOST", default: "209.46.122.17" },
        { name: "DB_PORT", message: "DB_PORT", default: "27017" },
        {
          name: "DB_NAME",
          message: "DB_NAME",
          default: projectName.toLowerCase().replace(/\s+/g, "-"),
        },
        {
          name: "JWT_SECRET",
          message: "JWT_SECRET",
          default: "jCsHhRo0m06gRO00Ve04pC24mgMt",
        },
        { name: "SMTP_HOST", message: "SMTP_HOST", default: "smtp.gmail.com" },
        { name: "SMTP_PORT", message: "SMTP_PORT", default: "587" },
      ]);

      const secretKey = generateSecretKey();
      const encryptionIv = generateEncryptionIv();

      apiEnvContent = `NODE_ENV=development
PROJECT_NAME=${projectName}
PORT=${answers.PORT}

# MongoDB
DB_USER=${answers.DB_USER}
DB_PASSWORD=${answers.DB_PASSWORD}
HOST=${answers.HOST}
DB_PORT=${answers.DB_PORT}
DB_NAME=${answers.DB_NAME}

# JWT
JWT_SECRET=${answers.JWT_SECRET}
JWT_EXPIRES_IN=7d

# Encryption
CRYPTO_SECURE_ENCRYPTION=${useCryptoSecure ? "true" : "false"}

# RSA keypair (auto-generated on first run when CRYPTO_SECURE_ENCRYPTION=true)
# CRYPTO_SECURE_PRIVATE_KEY=""
# CRYPTO_SECURE_PUBLIC_KEY=""

# Legacy AES-CBC (used when CRYPTO_SECURE_ENCRYPTION=false)
SECRET_KEY=${secretKey}
ENCRYPTION_IV=${encryptionIv}

# Seed
RUN_SEED=true                              # Seed default roles and admin user on startup
SEED_ADMIN_EMAIL=admin@test.com            # Admin email (used when RUN_SEED=true)
SEED_ADMIN_PASSWORD=Admin@123              # Admin password (used when RUN_SEED=true)

# Frontend
FRONT_WEB_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Email (Nodemailer)
SMTP_HOST=${answers.SMTP_HOST}
SMTP_PORT=${answers.SMTP_PORT}
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@${answers.DB_NAME}.com

# CORS
CORS_ORIGIN=*    # Set to your frontend URL in production (e.g., https://example.com)
`;
    }
  }

  if (createFrontend) {
    const { createEnv } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createEnv",
        message: "Do you want to create a .env file?",
        default: true,
      },
    ]);

    if (createEnv) {
      const { useCryptoSecure } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useCryptoSecure",
          message: "Use crypto-secure encryption (RSA+AES-GCM)?",
          default: false,
        },
      ]);

      const secretKey = generateSecretKey();
      const encryptionIv = generateEncryptionIv();

      frontendEnvContent = `VITE_API_BASE_URL=http://localhost:4000
VITE_CRYPTO_SECURE_ENCRYPTION=${useCryptoSecure ? "true" : "false"}
SECRET_KEY=${secretKey}
ENCRYPTION_IV=${encryptionIv}
`;
    }
  }

  if (createAdmin) {
    const { createEnv } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createEnv",
        message: "Do you want to create a .env file?",
        default: true,
      },
    ]);

    if (createEnv) {
      const { useCryptoSecure } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useCryptoSecure",
          message: "Use crypto-secure encryption (RSA+AES-GCM)?",
          default: false,
        },
      ]);

      const secretKey = generateSecretKey();
      const encryptionIv = generateEncryptionIv();

      adminEnvContent = `VITE_API_BASE_URL=http://localhost:4000
VITE_CRYPTO_SECURE_ENCRYPTION=${useCryptoSecure ? "true" : "false"}
SECRET_KEY=${secretKey}
ENCRYPTION_IV=${encryptionIv}
`;
    }
  }

  const { initGit } = await inquirer.prompt([
    {
      type: "confirm",
      name: "initGit",
      message: "Initialize Git repository?",
      default: true,
    },
  ]);

  let repoUrl = "";
  if (initGit) {
    const { url } = await inquirer.prompt([
      {
        type: "input",
        name: "url",
        message: "Enter GitHub repo URL (leave blank to skip push)",
      },
    ]);
    repoUrl = url;
  }

  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        let content = fs.readFileSync(srcPath, "utf8");
        content = content
          .replace(/<%= projectName %>/g, projectName)
          .replace(
            /<%= projectNameLowerCase %>/g,
            projectName.toLowerCase().replace(/\s+/g, "-"),
          );
        fs.writeFileSync(destPath, content, "utf8");
      }
    }
  }

  if (createApi && fs.existsSync(apiTemplatePath)) {
    copyDir(apiTemplatePath, targetPath);
    addEnginesToPackageJson(targetPath, finalNodeVersion);
    console.log("\x1b[32m  Created API (Backend)\x1b[0m");

    if (apiEnvContent) {
      fs.writeFileSync(path.join(targetPath, ".env"), apiEnvContent, "utf8");
      console.log("\x1b[32m  Created .env file\x1b[0m");
    }
  }

  if (createFrontend && fs.existsSync(frontendTemplatePath)) {
    copyDir(frontendTemplatePath, path.join(targetPath, "frontend"));
    addEnginesToPackageJson(
      path.join(targetPath, "frontend"),
      finalNodeVersion,
    );
    console.log("\x1b[32m  Created frontend platform\x1b[0m");

    if (frontendEnvContent) {
      fs.writeFileSync(
        path.join(targetPath, "frontend", ".env"),
        frontendEnvContent,
        "utf8",
      );
      console.log("\x1b[32m  Created frontend .env file\x1b[0m");
    }
  }

  if (createAdmin && fs.existsSync(adminTemplatePath)) {
    copyDir(adminTemplatePath, path.join(targetPath, "admin"));
    addEnginesToPackageJson(path.join(targetPath, "admin"), finalNodeVersion);
    console.log("\x1b[32m  Created admin panel\x1b[0m");

    if (adminEnvContent) {
      fs.writeFileSync(
        path.join(targetPath, "admin", ".env"),
        adminEnvContent,
        "utf8",
      );
      console.log("\x1b[32m  Created admin .env file\x1b[0m");
    }
  }

  fs.writeFileSync(
    path.join(targetPath, ".nvmrc"),
    finalNodeVersion + "\n",
    "utf8",
  );
  console.log("\x1b[32m  Created .nvmrc\x1b[0m");

  if (initGit) {
    console.log("\x1b[33m  Initializing Git...\x1b[0m");
    execSync("git init", { cwd: targetPath, stdio: "inherit" });
    execSync("git add .", { cwd: targetPath, stdio: "inherit" });
    execSync('git commit -m "Initial commit"', {
      cwd: targetPath,
      stdio: "inherit",
    });
  }

  if (createApi) {
    console.log("\x1b[33m  Installing API dependencies...\x1b[0m");
    execSync("npm install", { cwd: targetPath, stdio: "inherit" });
  }

  if (createFrontend) {
    console.log("\x1b[33m  Installing frontend dependencies...\x1b[0m");
    execSync("npm install", {
      cwd: path.join(targetPath, "frontend"),
      stdio: "inherit",
    });
  }

  if (createAdmin) {
    console.log("\x1b[33m  Installing admin dependencies...\x1b[0m");
    execSync("npm install", {
      cwd: path.join(targetPath, "admin"),
      stdio: "inherit",
    });
  }

  if (repoUrl) {
    console.log("\x1b[33m  Pushing to GitHub...\x1b[0m");
    try {
      execSync(`git remote add origin ${repoUrl}`, {
        cwd: targetPath,
        stdio: "inherit",
      });
      execSync("git branch -M main", { cwd: targetPath, stdio: "inherit" });
      execSync("git push -u origin main", {
        cwd: targetPath,
        stdio: "inherit",
      });
      console.log("\x1b[32m  Pushed to GitHub successfully\x1b[0m");
    } catch (err) {
      console.log(
        `\x1b[31m  Failed to push to GitHub: ${err.message.split("\n")[0]}\x1b[0m`,
      );
      console.log("\x1b[33m  You can push manually later:\x1b[0m");
      console.log(`    git remote add origin ${repoUrl}`);
      console.log("    git branch -M main");
      console.log("    git push -u origin main");
    }
  }

  const gitMsg = initGit
    ? "\x1b[32m  Git repository initialized successfully\x1b[0m"
    : "\x1b[33m  Git repository not initialized\x1b[0m";

  const apiMsg = createApi ? "\x1b[32m  API (Backend) created\x1b[0m" : "";
  const frontendMsg = createFrontend
    ? "\x1b[32m  Frontend platform created (frontend/)\x1b[0m"
    : "";
  const adminMsg = createAdmin
    ? "\x1b[32m  Admin panel created (admin/)\x1b[0m"
    : "";

  let nextSteps = "";
  if (createApi) nextSteps += `  cd ${projectName}\n  npm run dev\n`;
  if (createFrontend)
    nextSteps += `  cd ${projectName}/frontend\n  npm install\n  npm run dev\n`;
  if (createAdmin)
    nextSteps += `  cd ${projectName}/admin\n  npm install\n  npm run dev\n`;

  console.log(`

\x1b[36mProject "${projectName}" created successfully!\x1b[0m

  ${gitMsg}
${apiMsg ? `  ${apiMsg}` : ""}${frontendMsg ? `\n  ${frontendMsg}` : ""}${adminMsg ? `\n  ${adminMsg}` : ""}

\x1b[1mNext steps:\x1b[0m
${nextSteps}${
    createApi
      ? `
\x1b[1mPM2 Deployment:\x1b[0m
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
  `
      : ""
  }
\x1b[32mHappy coding!\x1b[0m
`);
}

main().catch((err) => {
  console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
  process.exit(1);
});
