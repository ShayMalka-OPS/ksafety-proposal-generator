import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, hashPassword } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: List all users
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("ks_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifySessionToken(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();

    // Check if user is admin
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users (exclude passwordHash)
    const users = await usersCollection
      .find({})
      .project({ passwordHash: 0 })
      .toArray();

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id!.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("[admin/users] GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new user
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("ks_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifySessionToken(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();

    // Check if user is admin
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await usersCollection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const passwordHash = hashPassword(password);
    const result = await usersCollection.insertOne({
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date(),
      lastLogin: null,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: result.insertedId.toString(),
          name,
          email,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[admin/users] POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
