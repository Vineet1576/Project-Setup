#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const inquirer = require("inquirer");
const { execSync } = require("child_process");

const pkg = require("../package.json");
const VERSION = pkg.version;

const apiTemplatePath = path.resolve(__dirname, "..", "api");
const frontendTemplatePath = path.resolve(__dirname, "..", "frontend");
const adminTemplatePath = path.resolve(__dirname, "..", "admin");

const API_MODULES = {
  user: {
    label: "User & Auth",
    core: true,
    files: [
      "src/controllers/userController.js",
      "src/routes/userRoutes.js",
      "src/services/userService.js",
      "src/repositories/userRepository.js",
      "src/models/User.js",
      "src/validations/userValidation.js",
    ],
    route: { path: "/users", file: "userRoutes" },
    repo: { key: "userRepo", file: "userRepository" },
    model: { key: "users", file: "User" },
  },
  role: {
    label: "Role",
    core: true,
    files: [
      "src/controllers/roleController.js",
      "src/routes/roleRoutes.js",
      "src/services/roleService.js",
      "src/repositories/roleRepository.js",
      "src/models/Role.js",
      "src/validations/roleValidation.js",
    ],
    route: { path: "/roles", file: "roleRoutes" },
    repo: { key: "roleRepo", file: "roleRepository" },
    model: { key: "roles", file: "Role" },
  },
  notification: {
    label: "Notifications",
    core: true,
    files: [
      "src/controllers/notificationController.js",
      "src/routes/notification.routes.js",
      "src/services/notificationService.js",
      "src/services/socket.js",
      "src/repositories/notificationRepository.js",
      "src/models/notification.model.js",
    ],
    route: { path: "/notifications", file: "notification.routes" },
    repo: { key: "notificationRepo", file: "notificationRepository" },
    model: { key: "notifications", file: "notification.model" },
  },
  settings: {
    label: "Settings",
    core: true,
    files: [
      "src/controllers/settingController.js",
      "src/routes/setting.routes.js",
      "src/services/settingService.js",
      "src/repositories/settingRepository.js",
      "src/models/settingModel.js",
    ],
    route: { path: "/settings", file: "setting.routes" },
    repo: { key: "settingRepo", file: "settingRepository" },
    model: { key: "settings", file: "settingModel" },
  },
  upload: {
    label: "Upload",
    core: true,
    files: [
      "src/controllers/uploadController.js",
      "src/routes/upload.routes.js",
      "src/services/uploadService.js",
    ],
    route: { path: "/upload", file: "upload.routes" },
  },
  dashboard: {
    label: "Dashboard",
    core: true,
    files: [
      "src/controllers/dashboardController.js",
      "src/routes/dashboard.routes.js",
      "src/services/dashboardService.js",
    ],
    route: { path: "/admin-dashboard", file: "dashboard.routes" },
  },
  plan: {
    label: "Plan",
    core: true,
    files: [
      "src/controllers/planController.js",
      "src/routes/planRoutes.js",
      "src/services/planService.js",
      "src/repositories/planRepository.js",
      "src/models/planModel.js",
    ],
    route: { path: "/plans", file: "planRoutes" },
    repo: { key: "planRepo", file: "planRepository" },
    model: { key: "plan", file: "planModel" },
  },
  subscription: {
    label: "Subscription",
    core: true,
    files: [
      "src/controllers/subscriptionController.js",
      "src/routes/subscription.routes.js",
      "src/services/subscriptionService.js",
      "src/services/subscriptionCron.js",
      "src/repositories/subscriptionRepository.js",
      "src/models/subscriptionModel.js",
      "src/Emails/stripeEmails.js",
      "src/utils/stripeConfig.js",
    ],
    route: { path: "/subscriptions", file: "subscription.routes" },
    repo: { key: "subscriptionRepo", file: "subscriptionRepository" },
    model: { key: "subscriptions", file: "subscriptionModel" },
  },
  transaction: {
    label: "Transaction",
    core: true,
    files: [
      "src/controllers/transactionController.js",
      "src/routes/transaction.routes.js",
      "src/services/transactionService.js",
      "src/repositories/transactionRepository.js",
      "src/models/transactionModel.js",
      "src/utils/invoices.js",
    ],
    route: { path: "/transactions", file: "transaction.routes" },
    repo: { key: "transactionRepo", file: "transactionRepository" },
    model: { key: "transactions", file: "transactionModel" },
  },
  feature: {
    label: "Feature",
    core: true,
    files: [
      "src/controllers/featureController.js",
      "src/routes/featureRoutes.js",
      "src/services/featureService.js",
      "src/repositories/featureRepository.js",
      "src/models/featureModel.js",
    ],
    route: { path: "/features", file: "featureRoutes" },
    repo: { key: "featureRepo", file: "featureRepository" },
    model: { key: "features", file: "featureModel" },
  },
  category: {
    label: "Category",
    files: [
      "src/controllers/CategoryController.js",
      "src/routes/category.routes.js",
      "src/services/categoryService.js",
      "src/repositories/categoryRepository.js",
      "src/models/category.model.js",
    ],
    route: { path: "/category", file: "category.routes" },
    repo: { key: "categoryRepo", file: "categoryRepository" },
    model: { key: "category", file: "category.model" },
  },
  feedback: {
    label: "Feedback",
    files: [
      "src/controllers/FeedbackController.js",
      "src/routes/Feedback.routes.js",
      "src/services/feedbackService.js",
      "src/repositories/feedbackRepository.js",
      "src/models/Feedback.model.js",
    ],
    route: { path: "/feedback", file: "Feedback.routes" },
    repo: { key: "feedbackRepo", file: "feedbackRepository" },
    model: { key: "feedback", file: "Feedback.model" },
  },
  contentManagement: {
    label: "Content Management",
    files: [
      "src/controllers/ContentManagementController.js",
      "src/routes/contentManagement.routes.js",
      "src/services/contentManagementService.js",
      "src/repositories/contentManagementRepository.js",
      "src/models/contentManagement.model.js",
    ],
    route: { path: "/content-management", file: "contentManagement.routes" },
    repo: { key: "contentManagementRepo", file: "contentManagementRepository" },
    model: { key: "contentManagement", file: "contentManagement.model" },
  },
  faqs: {
    label: "FAQs",
    files: [
      "src/controllers/faqController.js",
      "src/routes/faq.routes.js",
      "src/services/faqService.js",
      "src/repositories/faqRepository.js",
      "src/models/faqModel.js",
    ],
    route: { path: "/faqs", file: "faq.routes" },
    repo: { key: "faqRepo", file: "faqRepository" },
    model: { key: "faqs", file: "faqModel" },
  },
};

const API_ROUTE_ORDER = [
  "user",
  "role",
  "category",
  "feedback",
  "contentManagement",
  "feature",
  "plan",
  "subscription",
  "upload",
  "notification",
  "transaction",
  "dashboard",
  "faqs",
  "settings",
];

const API_REPO_ORDER = [
  "role",
  "user",
  "category",
  "feedback",
  "contentManagement",
  "feature",
  "plan",
  "subscription",
  "transaction",
  "notification",
  "faqs",
  "settings",
];

const API_MODEL_ORDER = [
  "user",
  "role",
  "category",
  "feedback",
  "contentManagement",
  "feature",
  "plan",
  "subscription",
  "transaction",
  "notification",
  "faqs",
  "settings",
];

const ADMIN_MODULES = {
  users: {
    label: "Users",
    requires: ["roles"],
    files: ["src/pages/users", "src/methods/api/users.js"],
    pages: [
      { name: "Users", importPath: "./pages/users", path: "/users" },
      {
        name: "AddUserPage",
        importPath: "./pages/users/AddUserPage",
        path: "/users/add",
      },
      {
        name: "ViewUserPage",
        importPath: "./pages/users/ViewUserPage",
        path: "/users/view",
      },
      {
        name: "EditUserPage",
        importPath: "./pages/users/EditUserPage",
        path: "/users/edit",
      },
    ],
  },
  roles: {
    label: "Roles",
    files: ["src/pages/roles", "src/methods/api/roles.js"],
    pages: [
      { name: "Roles", importPath: "./pages/roles", path: "/roles" },
      {
        name: "AddRolePage",
        importPath: "./pages/roles/AddRolePage",
        path: "/roles/add",
      },
      {
        name: "ViewRolePage",
        importPath: "./pages/roles/ViewRolePage",
        path: "/roles/view",
      },
      {
        name: "EditRolePage",
        importPath: "./pages/roles/EditRolePage",
        path: "/roles/edit",
      },
    ],
  },
  plans: {
    label: "Plans",
    core: true,
    files: ["src/pages/Plans", "src/methods/api/plans.js"],
    pages: [
      { name: "Plans", importPath: "./pages/Plans", path: "/plans" },
      {
        name: "AddPlanPage",
        importPath: "./pages/Plans/AddPlanPage",
        path: "/plans/add",
      },
      {
        name: "ViewPlanPage",
        importPath: "./pages/Plans/ViewPlanPage",
        path: "/plans/view",
      },
      {
        name: "EditPlanPage",
        importPath: "./pages/Plans/EditPlanPage",
        path: "/plans/edit",
      },
    ],
  },
  transactions: {
    label: "Transactions",
    core: true,
    files: ["src/pages/Transactions", "src/methods/api/transactions.js"],
    pages: [
      { name: "Transactions", importPath: "./pages/Transactions", path: "/transactions" },
      {
        name: "ViewTransactionPage",
        importPath: "./pages/Transactions/ViewTransactionPage",
        path: "/transactions/view",
      },
    ],
  },
  categories: {
    label: "Categories",
    files: ["src/pages/Categories", "src/methods/api/categories.js"],
    pages: [
      { name: "Categories", importPath: "./pages/Categories", path: "/categories" },
      {
        name: "AddCategoryPage",
        importPath: "./pages/Categories/AddCategoryPage",
        path: "/categories/add",
      },
      {
        name: "EditCategoryPage",
        importPath: "./pages/Categories/EditCategoryPage",
        path: "/categories/edit",
      },
    ],
  },
  contentManagement: {
    label: "Content Management",
    files: ["src/pages/ContentManagement", "src/methods/api/content.js"],
    pages: [
      {
        name: "ContentManagement",
        importPath: "./pages/ContentManagement",
        path: "/content-management",
      },
      {
        name: "AddContentPage",
        importPath: "./pages/ContentManagement/AddContentPage",
        path: "/content-management/add",
      },
      {
        name: "ViewContentPage",
        importPath: "./pages/ContentManagement/ViewContentPage",
        path: "/content-management/view",
      },
      {
        name: "EditContentPage",
        importPath: "./pages/ContentManagement/EditContentPage",
        path: "/content-management/edit",
      },
    ],
  },
  feedback: {
    label: "Feedback",
    files: ["src/pages/Feedback", "src/methods/api/feedback.js"],
    pages: [
      { name: "Feedback", importPath: "./pages/Feedback", path: "/feedback" },
      {
        name: "ViewFeedbackPage",
        importPath: "./pages/Feedback/ViewFeedbackPage",
        path: "/feedback/view",
      },
    ],
  },
  features: {
    label: "Features",
    core: true,
    files: ["src/pages/Features", "src/methods/api/features.js"],
    pages: [
      { name: "Features", importPath: "./pages/Features", path: "/features" },
      {
        name: "AddFeaturePage",
        importPath: "./pages/Features/AddFeaturePage",
        path: "/features/add",
      },
      {
        name: "EditFeaturePage",
        importPath: "./pages/Features/EditFeaturePage",
        path: "/features/edit",
      },
    ],
  },
  notifications: {
    label: "Notifications",
    core: true,
    files: ["src/pages/Notifications", "src/methods/api/notifications.js"],
    pages: [
      {
        name: "Notifications",
        importPath: "./pages/Notifications",
        path: "/notifications",
      },
      {
        name: "ViewNotificationPage",
        importPath: "./pages/Notifications/ViewNotificationPage",
        path: "/notifications/view",
      },
      {
        name: "BroadcastPage",
        importPath: "./pages/Notifications/BroadcastPage",
        path: "/notifications/broadcast",
      },
    ],
  },
  faqs: {
    label: "FAQs",
    files: ["src/pages/Faqs", "src/methods/api/faqs.js"],
    pages: [
      { name: "Faqs", importPath: "./pages/Faqs", path: "/faqs" },
      {
        name: "AddFaqPage",
        importPath: "./pages/Faqs/AddFaqPage",
        path: "/faqs/add",
      },
      {
        name: "ViewFaqPage",
        importPath: "./pages/Faqs/ViewFaqPage",
        path: "/faqs/view",
      },
      {
        name: "EditFaqPage",
        importPath: "./pages/Faqs/EditFaqPage",
        path: "/faqs/edit",
      },
    ],
  },
};

const ADMIN_ROUTE_ORDER = [
  "users",
  "roles",
  "plans",
  "transactions",
  "categories",
  "contentManagement",
  "feedback",
  "features",
  "notifications",
  "faqs",
];

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString("hex");
}

function printUsage() {
  console.log(`create-project v${VERSION}

Usage:
  create-project <project-name> [options]

Options:
  -h, --help      Show this help message
  -V, --version   Show version number
  -y, --yes       Non-interactive: create an API project with default settings and all modules

Examples:
  create-project my-app
  create-project my-app --yes`);
}

function parseArgs(argv) {
  const args = { projectName: null, help: false, version: false, yes: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-V") {
      args.version = true;
    } else if (arg === "--yes" || arg === "-y") {
      args.yes = true;
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}\n`);
      printUsage();
      process.exit(1);
    } else if (args.projectName === null) {
      args.projectName = arg;
    } else {
      console.error(`Unexpected extra argument: ${arg}\n`);
      printUsage();
      process.exit(1);
    }
  }
  return args;
}

function validateProjectName(name) {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return "must contain only letters, numbers, dots, underscores and dashes";
  }
  if (name === "." || name === ".." || /^[.-]/.test(name)) {
    return "must not be '.' or '..' and must not start with '.' or '-'";
  }
  if (name.length > 100) {
    return "must be 100 characters or fewer";
  }
  return null;
}

function addEnginesToPackageJson(pkgPath, version) {
  const pkgFile = path.join(pkgPath, "package.json");
  if (!fs.existsSync(pkgFile)) return;
  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
  pkg.engines = { node: `>=${version}.0.0` };
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function writeEnvFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  if (process.platform !== "win32") {
    fs.chmodSync(filePath, 0o600);
  }
}

function parseGitignore(content) {
  const patterns = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    let pattern = line.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\*\*/g, "*");
    const regex = new RegExp(
      "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
      "i",
    );
    patterns.push(regex);
  }
  return patterns;
}

function loadIgnorePatterns(src) {
  const gitignorePath = path.join(src, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return [];
  return parseGitignore(fs.readFileSync(gitignorePath, "utf8"));
}

function isIgnored(name, patterns) {
  return patterns.some((regex) => regex.test(name));
}

function isBinaryFile(filePath) {
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(1024);
  const bytesRead = fs.readSync(fd, buf, 0, 1024, 0);
  fs.closeSync(fd);
  return buf.slice(0, bytesRead).includes(0);
}

function copyDir(src, dest, patterns, projectName) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (patterns.length && isIgnored(entry.name, patterns)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, patterns, projectName);
    } else if (isBinaryFile(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
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

function runStep(label, fn) {
  try {
    console.log(`\x1b[33m  ${label}...\x1b[0m`);
    fn();
    return true;
  } catch (err) {
    console.log(
      `\x1b[31m  ${label} failed: ${String(err.message).split("\n")[0]}\x1b[0m`,
    );
    return false;
  }
}

async function promptPlatform(yes) {
  if (yes) return "api";
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
  return platform;
}

async function promptNodeVersion(yes) {
  if (yes) return "20";
  const { nodeVersion } = await inquirer.prompt([
    {
      type: "list",
      name: "nodeVersion",
      message: "Select Node.js version for this project:",
      choices: [
        { name: "Node 18.x", value: "18" },
        { name: "Node 20.x (LTS)", value: "20" },
        { name: "Node 22.x", value: "22" },
        { name: "Node 24.x (Current)", value: "24" },
        { name: "Custom", value: "custom" },
      ],
    },
  ]);
  if (nodeVersion !== "custom") return nodeVersion;
  const { custom } = await inquirer.prompt([
    {
      type: "input",
      name: "custom",
      message: "Enter Node.js version (e.g. 20, 20.11, 22.3):",
      default: "20",
      validate: (value) =>
        /^\d+(\.\d+)*$/.test(value) || "Enter a valid version like 20 or 20.11",
    },
  ]);
  return custom;
}

async function promptCreateEnv(platform, yes) {
  if (yes) return true;
  const { createEnv } = await inquirer.prompt([
    {
      type: "confirm",
      name: "createEnv",
      message: `Do you want to create a .env file for the ${platform}?`,
      default: true,
    },
  ]);
  return createEnv;
}

async function promptUseCryptoSecure(yes) {
  if (yes) return false;
  const { useCryptoSecure } = await inquirer.prompt([
    {
      type: "confirm",
      name: "useCryptoSecure",
      message: "Use crypto-secure encryption (RSA+AES-GCM)?",
      default: false,
    },
  ]);
  return useCryptoSecure;
}

async function promptApiEnv(projectName, yes, useCryptoSecure) {
  const dbName = projectName.toLowerCase().replace(/\s+/g, "-");
  const defaults = {
    PORT: "3000",
    DB_USER: "",
    DB_PASSWORD: "",
    HOST: "localhost",
    DB_PORT: "27017",
    DB_NAME: dbName,
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
  };

  let answers;
  if (yes) {
    answers = { ...defaults, JWT_SECRET: randomHex(16) };
  } else {
    console.log("\n\x1b[33m  Enter your API configuration values:\x1b[0m\n");
    answers = await inquirer.prompt([
      { name: "PORT", message: "PORT", default: defaults.PORT },
      {
        name: "DB_USER",
        message: "DB_USER (MongoDB username, empty to skip)",
        default: defaults.DB_USER,
      },
      {
        name: "DB_PASSWORD",
        message: "DB_PASSWORD (MongoDB password, empty to skip)",
        default: defaults.DB_PASSWORD,
      },
      {
        name: "HOST",
        message: "HOST (MongoDB host)",
        default: defaults.HOST,
      },
      { name: "DB_PORT", message: "DB_PORT", default: defaults.DB_PORT },
      { name: "DB_NAME", message: "DB_NAME", default: defaults.DB_NAME },
      {
        name: "JWT_SECRET",
        message: "JWT_SECRET (empty to auto-generate)",
        default: "",
      },
      { name: "SMTP_HOST", message: "SMTP_HOST", default: defaults.SMTP_HOST },
      { name: "SMTP_PORT", message: "SMTP_PORT", default: defaults.SMTP_PORT },
    ]);
    if (!answers.JWT_SECRET) answers.JWT_SECRET = randomHex(16);
  }

  const secretKey = randomHex(16);
  const encryptionIv = randomHex(16);
  const seedAdminPassword = "Admin@" + randomHex(6);

  const envContent = `NODE_ENV=development
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
SEED_ADMIN_PASSWORD=${seedAdminPassword}   # Admin password (used when RUN_SEED=true)

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

  return { envContent, seedAdminPassword };
}

async function promptGit(yes) {
  if (yes) return { initGit: true, repoUrl: "" };
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
  return { initGit, repoUrl };
}

function expandModuleDependencies(selected, catalog) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of Array.from(selected)) {
      const mod = catalog[key];
      if (!mod || !mod.requires) continue;
      for (const dep of mod.requires) {
        if (!selected.has(dep)) {
          selected.add(dep);
          changed = true;
        }
      }
    }
  }
}

async function promptModules(platform, yes) {
  const catalog = platform === "api" ? API_MODULES : ADMIN_MODULES;
  const allKeys = Object.keys(catalog);
  if (yes) return new Set(allKeys);

  const { modules } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "modules",
      message: `Select modules for the ${platform.toUpperCase()} project (core modules are required):`,
      choices: allKeys.map((key) => ({
        name: catalog[key].core
          ? `${catalog[key].label} (required)`
          : catalog[key].label,
        value: key,
        checked: true,
        disabled: catalog[key].core ? "(required)" : false,
      })),
      pageSize: Math.min(16, allKeys.length),
    },
  ]);

  const selected = new Set(allKeys.filter((key) => catalog[key].core));
  modules.forEach((key) => selected.add(key));
  expandModuleDependencies(selected, catalog);
  return selected;
}

function generateRoutesIndex(selected) {
  const lines = API_ROUTE_ORDER.filter((key) => selected.has(key)).map((key) => {
    const mod = API_MODULES[key];
    return `router.use("${mod.route.path}", require("./${mod.route.file}"));`;
  });
  return `const router = require("express").Router();\n\n${lines.join(
    "\n",
  )}\n\nmodule.exports = router;\n`;
}

function generateRepositoriesIndex(selected) {
  const keys = API_REPO_ORDER.filter((key) => selected.has(key));
  const requires = keys.map((key) => {
    const mod = API_MODULES[key];
    return `const ${mod.repo.key} = require("./${mod.repo.file}");`;
  });
  return `${requires.join(
    "\n",
  )}\n\nmodule.exports = {\n  ${keys
    .map((key) => API_MODULES[key].repo.key)
    .join(",\n  ")},\n};\n`;
}

function generateModelsIndex(selected) {
  const keys = API_MODEL_ORDER.filter((key) => selected.has(key));
  const lines = keys.map((key) => {
    const mod = API_MODULES[key];
    return `db.${mod.model.key} = require("./${mod.model.file}")(mongoose);`;
  });
  return `const mongoose = require("mongoose");\n\nconst db = {};\n\n${lines.join(
    "\n",
  )}\n\nmodule.exports = db;\n`;
}

function generateValidationsIndex(selected) {
  const lines = [
    "const UserValidations = require('./userValidation');",
    "const RoleValidations = require('./roleValidation');",
    "",
  ];
  const exportsList = ["UserValidations", "RoleValidations"];
  if (selected.has("feature")) {
    lines.push(
      "const Feature = {",
      "  addFeature: async (req) => ({ success: true }),",
      "  editFeature: async (req) => ({ success: true }),",
      "  idCheck: async (req) => ({ success: true }),",
      "};",
      "",
    );
    exportsList.push("Feature");
  }
  if (selected.has("plan")) {
    lines.push(
      "const Plan = {",
      "  addPlan: async (req) => ({ success: true }),",
      "  updatePlan: async (req) => ({ success: true }),",
      "};",
      "",
    );
    exportsList.push("Plan");
  }
  if (selected.has("subscription")) {
    lines.push(
      "const Subscriptions = {",
      "  purchaseSubscriptionPlan: async (req) => ({ success: true }),",
      "  idCheck: async (req) => ({ success: true }),",
      "};",
      "",
    );
    exportsList.push("Subscriptions");
  }
  lines.push("const Notification = require('./notificationValidation');", "");
  exportsList.push("Notification");
  lines.push(`module.exports = { ${exportsList.join(", ")} };`);
  return lines.join("\n") + "\n";
}

function generateAdminAppJsx(selected) {
  const imports = [
    "import { Routes, Route, Navigate } from 'react-router-dom';",
    "import { ConfirmProvider } from './context/ConfirmContext';",
    "import Layout from './components/global/layout';",
    "import ProtectedRoute from './components/common/ProtectedRoute';",
    "import ScrollToTop from './components/common/ScrollToTop';",
    "import Login from './pages/Login';",
    "import Dashboard from './pages/Dashboard';",
  ];
  const routes = [
    `          <Route path="/login" element={<Login />} />`,
    `          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />`,
  ];
  for (const key of ADMIN_ROUTE_ORDER) {
    if (!selected.has(key)) continue;
    for (const page of ADMIN_MODULES[key].pages) {
      imports.push(`import ${page.name} from '${page.importPath}';`);
      routes.push(
        `          <Route path="${page.path}" element={<ProtectedRoute><${page.name} /></ProtectedRoute>} />`,
      );
    }
  }
  imports.push(
    "import Settings from './pages/Settings';",
    "import Profile from './pages/Profile';",
    "import ChangePassword from './pages/ChangePassword';",
    "",
  );
  routes.push(
    `          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />`,
    `          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />`,
    `          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />`,
    `          <Route path="*" element={<Navigate to="/" replace />} />`,
  );
  return `${imports.join("\n")}
export default function App() {
  return (
    <ConfirmProvider>
      <ScrollToTop />
      <Layout>
        <Routes>
${routes.join("\n")}
          </Routes>
        </Layout>
    </ConfirmProvider>
  );
}
`;
}

function generateAdminModulesJs(selected) {
  const enabled = Object.keys(ADMIN_MODULES).filter((key) => selected.has(key));
  return `// Generated by create-project — enabled admin modules\n\nexport const enabledModules = ${JSON.stringify(
    enabled,
  )};\n`;
}

function applyApiModuleSelection(targetPath, selected) {
  for (const [key, mod] of Object.entries(API_MODULES)) {
    if (selected.has(key)) continue;
    for (const rel of mod.files) {
      const filePath = path.join(targetPath, rel);
      if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
    }
  }
  fs.writeFileSync(
    path.join(targetPath, "src/routes/index.js"),
    generateRoutesIndex(selected),
    "utf8",
  );
  fs.writeFileSync(
    path.join(targetPath, "src/repositories/index.js"),
    generateRepositoriesIndex(selected),
    "utf8",
  );
  fs.writeFileSync(
    path.join(targetPath, "src/models/index.js"),
    generateModelsIndex(selected),
    "utf8",
  );
  fs.writeFileSync(
    path.join(targetPath, "src/validations/index.js"),
    generateValidationsIndex(selected),
    "utf8",
  );
}

function applyAdminModuleSelection(targetPath, selected) {
  for (const [key, mod] of Object.entries(ADMIN_MODULES)) {
    if (selected.has(key)) continue;
    for (const rel of mod.files) {
      const filePath = path.join(targetPath, rel);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  }
  fs.writeFileSync(
    path.join(targetPath, "src/App.jsx"),
    generateAdminAppJsx(selected),
    "utf8",
  );
  fs.mkdirSync(path.join(targetPath, "src/config"), { recursive: true });
  fs.writeFileSync(
    path.join(targetPath, "src/config/modules.js"),
    generateAdminModulesJs(selected),
    "utf8",
  );
}

function applyModuleSelection(targetPath, platform, selected) {
  if (platform === "api") applyApiModuleSelection(targetPath, selected);
  else if (platform === "admin") applyAdminModuleSelection(targetPath, selected);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printUsage();
    return;
  }
  if (args.version) {
    console.log(VERSION);
    return;
  }
  if (!args.projectName) {
    console.error("Error: project name is required\n");
    printUsage();
    process.exit(1);
  }

  const projectName = args.projectName;
  const yes = args.yes;
  const validationError = validateProjectName(projectName);
  if (validationError) {
    console.error(
      `Error: Invalid project name "${projectName}" - ${validationError}`,
    );
    process.exit(1);
  }

  const targetPath = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(targetPath)) {
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  console.log(
    `\n\x1b[36mCreating project: ${projectName}\x1b[0m${yes ? " (non-interactive)" : ""}\n`,
  );

  const platform = await promptPlatform(yes);
  const nodeVersion = await promptNodeVersion(yes);
  const createApi = platform === "api";
  const createFrontend = platform === "frontend";
  const createAdmin = platform === "admin";

  const selectedModules =
    createApi || createAdmin ? await promptModules(platform, yes) : null;

  let apiEnvContent = "";
  let frontendEnvContent = "";
  let adminEnvContent = "";
  let seedAdminPassword = "";
  let useCryptoSecure = false;

  if (createApi) {
    const createEnv = await promptCreateEnv(platform, yes);
    if (createEnv) {
      useCryptoSecure = await promptUseCryptoSecure(yes);
      const apiEnv = await promptApiEnv(projectName, yes, useCryptoSecure);
      apiEnvContent = apiEnv.envContent;
      seedAdminPassword = apiEnv.seedAdminPassword;
    }
  }

  if (createFrontend && (await promptCreateEnv(platform, yes))) {
    frontendEnvContent = `VITE_API_BASE_URL=http://localhost:4000
# Crypto keys (CRYPTO_SECURE_ENCRYPTION, SECRET_KEY, ENCRYPTION_IV) are
# fetched at runtime from GET /settings/crypto — no env keys needed here.
`;
  }

  if (createAdmin && (await promptCreateEnv(platform, yes))) {
    adminEnvContent = `VITE_API_BASE_URL=http://localhost:4000
# Crypto keys (CRYPTO_SECURE_ENCRYPTION, SECRET_KEY, ENCRYPTION_IV) are
# fetched at runtime from GET /settings/crypto — no env keys needed here.
`;
  }

  const { initGit, repoUrl } = await promptGit(yes);

  if (createApi && fs.existsSync(apiTemplatePath)) {
    copyDir(apiTemplatePath, targetPath, loadIgnorePatterns(apiTemplatePath), projectName);
    addEnginesToPackageJson(targetPath, nodeVersion);
    console.log("\x1b[32m  Created API (Backend)\x1b[0m");

    if (apiEnvContent) {
      writeEnvFile(path.join(targetPath, ".env"), apiEnvContent);
      console.log("\x1b[32m  Created .env file\x1b[0m");
    }
  }

  if (createFrontend && fs.existsSync(frontendTemplatePath)) {
    copyDir(
      frontendTemplatePath,
      path.join(targetPath, "frontend"),
      loadIgnorePatterns(frontendTemplatePath),
      projectName,
    );
    addEnginesToPackageJson(path.join(targetPath, "frontend"), nodeVersion);
    console.log("\x1b[32m  Created frontend platform\x1b[0m");

    if (frontendEnvContent) {
      writeEnvFile(path.join(targetPath, "frontend", ".env"), frontendEnvContent);
      console.log("\x1b[32m  Created frontend .env file\x1b[0m");
    }
  }

  if (createAdmin && fs.existsSync(adminTemplatePath)) {
    copyDir(
      adminTemplatePath,
      path.join(targetPath, "admin"),
      loadIgnorePatterns(adminTemplatePath),
      projectName,
    );
    addEnginesToPackageJson(path.join(targetPath, "admin"), nodeVersion);
    console.log("\x1b[32m  Created admin panel\x1b[0m");

    if (adminEnvContent) {
      writeEnvFile(path.join(targetPath, "admin", ".env"), adminEnvContent);
      console.log("\x1b[32m  Created admin .env file\x1b[0m");
    }
  }

  fs.writeFileSync(path.join(targetPath, ".nvmrc"), nodeVersion + "\n", "utf8");
  console.log("\x1b[32m  Created .nvmrc\x1b[0m");

  if (selectedModules) {
    applyModuleSelection(
      createApi ? targetPath : path.join(targetPath, "admin"),
      platform,
      selectedModules,
    );
    console.log("\x1b[32m  Applied selected modules\x1b[0m");
  }

  let gitReady = false;
  if (initGit) {
    gitReady = runStep("Initializing Git", () =>
      execSync("git init", { cwd: targetPath, stdio: "inherit" }),
    );
    if (gitReady) {
      gitReady = runStep("Staging files", () =>
        execSync("git add .", { cwd: targetPath, stdio: "inherit" }),
      );
    }
    if (gitReady) {
      gitReady = runStep("Creating initial commit", () =>
        execSync('git commit -m "Initial commit"', {
          cwd: targetPath,
          stdio: "inherit",
        }),
      );
      if (!gitReady) {
        console.log(
          "\x1b[33m  Tip: set your git identity first, then run:\x1b[0m\n    git add .\n    git commit -m \"Initial commit\"",
        );
      }
    }
  }

  if (createApi) {
    runStep("Installing API dependencies", () =>
      execSync("npm install --no-audit --no-fund", {
        cwd: targetPath,
        stdio: "inherit",
      }),
    );
  }

  if (createFrontend) {
    runStep("Installing frontend dependencies", () =>
      execSync("npm install --no-audit --no-fund", {
        cwd: path.join(targetPath, "frontend"),
        stdio: "inherit",
      }),
    );
  }

  if (createAdmin) {
    runStep("Installing admin dependencies", () =>
      execSync("npm install --no-audit --no-fund", {
        cwd: path.join(targetPath, "admin"),
        stdio: "inherit",
      }),
    );
  }

  if (repoUrl) {
    if (!gitReady) {
      console.log("\x1b[33m  Skipping push because the initial commit failed.\x1b[0m");
      console.log("  Push manually:");
      console.log(`    git remote add origin ${repoUrl}`);
      console.log("    git branch -M main");
      console.log("    git push -u origin main");
    } else {
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

  const seedCredsMsg =
    createApi && seedAdminPassword
      ? `\n\x1b[1mSeed admin:\x1b[0m admin@test.com / ${seedAdminPassword}\n`
      : "";

  console.log(`
\n\x1b[36mProject "${projectName}" created successfully!\x1b[0m
${seedCredsMsg}
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