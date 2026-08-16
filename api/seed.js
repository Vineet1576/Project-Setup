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
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    if (!adminRole) {
      console.log('Admin role not found — cannot create admin user');
    } else {
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

    if (db.faqs) {
      const faqData = [
        {
          category: 'Getting started',
          items: [
            {
              question: 'How do I create an account?',
              answer:
                'Click "Get Started" in the navigation or visit /register. Fill in your name, email and password, then confirm your email address using the verification link we send you.',
            },
            {
              question: 'How do I verify my email?',
              answer:
                'After signing up, check your inbox for a single-use verification link. It expires after 24 hours — if it has expired, request a new one from the login page.',
            },
            {
              question: 'What happens after I log in?',
              answer:
                'You are taken to your profile page, where you can view and edit your personal details. All requests from that point are signed with your JWT.',
            },
          ],
        },
        {
          category: 'Authentication & accounts',
          items: [
            {
              question: 'I forgot my password. What do I do?',
              answer:
                'Visit /forgot-password, enter your email and you will receive a single-use OTP. Use it on the reset page to set a new password.',
            },
            {
              question: 'Can I use the same email for two accounts?',
              answer:
                'No. Each email address maps to exactly one user. If you try to register an existing email, the API returns an error explaining that the account already exists.',
            },
            {
              question: 'Why was I logged out?',
              answer:
                'Sessions end when your JWT expires or is invalidated. Simply sign in again to obtain a fresh token.',
            },
          ],
        },
        {
          category: 'Encryption & security',
          items: [
            {
              question: 'Is my password stored in plaintext?',
              answer:
                'Never. Passwords are hashed with a secure one-way algorithm before storage. They cannot be recovered, only reset.',
            },
            {
              question: 'What is hybrid RSA + AES-GCM encryption?',
              answer:
                'Every request body is encrypted with AES-256-GCM and the session key is wrapped with a server RSA-2048 public key. The server unwraps and decrypts transparently — nothing sensitive travels in plaintext.',
            },
            {
              question: 'Where are the encryption keys stored?',
              answer:
                'The RSA keypair is generated on first run and written to your .env file. No keys are kept on disk in a separate directory, and private keys never leave the server.',
            },
          ],
        },
        {
          category: 'Troubleshooting',
          items: [
            {
              question: 'I never received the verification email.',
              answer:
                'Check your spam or promotions folder first. Make sure the email address is correct, then request a new link. Add our domain to your contacts so future mail lands in your inbox.',
            },
            {
              question: 'The page shows an error after signing in.',
              answer:
                'Hard-refresh the page (Ctrl+Shift+R) and try again. If the issue persists, contact us from the Feedback page and include the exact error message you saw.',
            },
            {
              question: 'My token expired while I was working.',
              answer:
                'Security tokens are intentionally short-lived. Sign back in to continue where you left off — your account data is untouched.',
            },
          ],
        },
      ];

      const existingFaqCount = await db.faqs.countDocuments({ isDeleted: false });
      if (existingFaqCount > 0) {
        console.log('FAQs already seeded');
      } else {
        const faqDocs = faqData.flatMap((group) =>
          group.items.map((item, i) => ({
            category: group.category,
            question: item.question,
            answer: item.answer,
            order: i + 1,
            status: 'active',
            isDeleted: false,
          })),
        );
        await db.faqs.insertMany(faqDocs);
        console.log('FAQs seeded');
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
