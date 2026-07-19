const bcrypt = require('bcryptjs');
const { default: mongoose } = require('mongoose');
const db = require('./src/models');

const dbUrl = require('./src/config/db.config').url;

async function seed() {
  try {
    const existing = await db.roles.findOne({ name: 'admin' });
    if (existing) {
      console.log('Admin role already exists:', existing.displayName);
    } else {
      const role = await db.roles.create({
        name: 'admin',
        displayName: 'Admin',
        description: 'Full system access',
        permissions: ['*'],
        isSystemRole: true,
        status: 'active',
      });
      console.log('Admin role created:', role.displayName);
    }

    const existingUserRole = await db.roles.findOne({ name: 'user' });
    if (!existingUserRole) {
      const role = await db.roles.create({
        name: 'user',
        displayName: 'User',
        description: 'Standard user access',
        permissions: ['read', 'write'],
        isSystemRole: true,
        status: 'active',
      });
      console.log('User role created:', role.displayName);
    }

    const existingSuperAdmin = await db.roles.findOne({ name: 'super_admin' });
    if (!existingSuperAdmin) {
      const role = await db.roles.create({
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Super administrator with all permissions',
        permissions: ['*'],
        isSystemRole: true,
        status: 'active',
      });
      console.log('Super Admin role created:', role.displayName);
    }

    const adminRole = await db.roles.findOne({ name: 'admin' });
    if (!adminRole) {
      console.log('Admin role not found — cannot create admin user');
    } else {
      const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@test.com';
      const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
      const existingAdmin = await db.users.findOne({ email: adminEmail, isDeleted: false });
      if (existingAdmin) {
        console.log('Admin user already exists:', adminEmail);
      } else {
        const hashedPassword = bcrypt.hashSync(adminPassword, bcrypt.genSaltSync(10));
        await db.users.create({
          firstName: 'Admin',
          lastName: 'User',
          fullName: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: adminRole._id,
          isVerified: 'Y',
          status: 'active',
          mobileno: '',
        });
        console.log('Admin user created:');
        console.log('  Email:    ' + adminEmail);
        console.log('  Password: ' + adminPassword);
      }
    }

    console.log('Seed completed');
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 10000 });
      console.log('Connected to MongoDB');
      await seed();
      await mongoose.disconnect();
      console.log('Done');
      process.exit(0);
    } catch (err) {
      console.error('Seed failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = seed;
