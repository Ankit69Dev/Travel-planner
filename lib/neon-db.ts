import { neon } from '@neondatabase/serverless';

export async function saveUser(email: string, name: string | null, image: string | null) {
  
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    // Check if user exists
    const existing = await sql`
      SELECT id FROM "User" WHERE email = ${email}
    `;
    
    if (existing.length === 0) {
      // Create new user
      await sql`
        INSERT INTO "User" (id, email, name, image, "emailVerified", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${email},
          ${name},
          ${image},
          NOW(),
          NOW()
        )
      `;
      console.log("✅ New user created:", email);
    } else {
      // Update existing user
      await sql`
        UPDATE "User"
        SET name = ${name}, image = ${image}
        WHERE email = ${email}
      `;
      console.log("✅ User updated:", email);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error saving user:", error);
    return false;
  }
}