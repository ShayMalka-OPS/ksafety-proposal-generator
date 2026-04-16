import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";

const DEFAULT_ADMIN = {
  name: "Admin",
  email: "admin@kabatone.com",
  password: "Admin@2026",
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const usersCollection = await getUsersCollection();

    // Check if users collection is empty; if so, create default admin
    const userCount = await usersCollection.countDocuments({});
    if (userCount === 0) {
      const adminPasswordHash = hashPassword(DEFAULT_ADMIN.password);
      await usersCollection.insertOne({
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        passwordHash: adminPasswordHash,
        role: "admin",
        createdAt: new Date(),
        lastLogin: null,
      });
    }

    // Look up user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update lastLogin
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Create session token
    const userId = user._id!.toString();
    const sessionToken = createSessionToken(userId);

    // Set httpOnly cookie
    const response = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("ks_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[auth/login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
