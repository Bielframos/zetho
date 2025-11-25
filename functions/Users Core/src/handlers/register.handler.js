import crypto from 'node:crypto';
import { Query } from 'node-appwrite';

function normalizeEmail(email) {
  email = email.trim().toLowerCase();
  const [local, domain] = email.split('@');

  if (domain === 'gmail.com') {
    return local.replace(/\./g, '').split('+')[0] + '@gmail.com';
  }

  return email;
}

function generateFingerprint(email) {
  const normalized = normalizeEmail(email);
  return crypto.createHash('sha256').update(normalized).digest('base64url');
}

async function registerHandler(ctx) {
  const payload = ctx.req.bodyJson;
  const requiredFields = ['email', 'name', 'gamertag', 'password'];

  if (!payload)
    return ctx.res.json({ message: 'Bad request, body not found.' }, 400);
  if (requiredFields.some((field) => !(field in payload)))
    return ctx.res.json({ message: 'Missing required fields' }, 400);

  const { email, name, gamertag, password } = payload;

  try {
    const user = await ctx.users.create({
      userId: 'unique()',
      email,
      password,
      name,
    });

    const fingerprint = generateFingerprint(email);

    const existingProfileRes = await ctx.databases.listRows({
      databaseId: 'app',
      tableId: 'user_profiles',
      queries: [Query.equal('fingerprint', fingerprint), Query.select('$id')],
    });

    let profile;

    if (existingProfileRes.total > 0) {
      const existingProfile = existingProfileRes.rows[0];

      profile = await ctx.databases.updateRow({
        databaseId: 'app',
        tableId: 'user_profiles',
        rowId: existingProfile.$id,
        data: { userId: user.$id, gamertag, fingerprint },
      });
    } else {
      profile = await ctx.databases.createRow({
        databaseId: 'app',
        tableId: 'user_profiles',
        rowId: 'unique()',
        data: { userId: user.$id, gamertag, fingerprint },
      });
    }

    return ctx.res.json({ user: { $id: user.$id }, profile }, 201);
  } catch (e) {
    ctx.error('Error during user creation', e);

    if (e.code === 409) {
      return ctx.res.json(
        { message: 'Email already registered.', code: 409 },
        409
      );
    }

    return ctx.res.json(
      { message: 'Error during user creation.', code: 500 },
      500
    );
  }
}

export default registerHandler;
