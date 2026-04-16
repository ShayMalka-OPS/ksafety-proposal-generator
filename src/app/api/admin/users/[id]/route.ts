import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, hashPassword } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// DELETE: Delete user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionToken = request.cookies.get("ks_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifySessionToken(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();

    // Check if caller is admin
    const caller = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!caller || caller.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent self-delete
    if (userId === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users/[id]] DELETE Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update password for any user (caller must be admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionToken = request.cookies.get("ks_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerId = verifySessionToken(sessionToken);
    if (!callerId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const usersCollection = await getUsersCollection();

    // Caller must be admin
    const caller = await usersCollection.findOne({ _id: new ObjectId(callerId) });
    if (!caller || caller.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Target user must exist
    const target = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashed = hashPassword(newPassword);
    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { passwordHash: hashed, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users/[id]] PATCH Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
