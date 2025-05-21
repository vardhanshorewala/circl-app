import { NextResponse } from "next/server";
import { Neo4jUserClient, generateUserHash } from "../../../server/db/neo4j";
import type { User, Connection } from "../../../types/user";

export async function POST(request: Request) {
  try {
    const { user, connections } = await request.json();
    
    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Create or update the user
    const createdUser = await Neo4jUserClient.createUser(user as User);
    
    // Add connections if provided
    let createdConnections: Connection[] = [];
    if (connections && Array.isArray(connections)) {
      createdConnections = await Neo4jUserClient.createConnections(
        createdUser.id,
        connections
      );
    }

    return NextResponse.json({
      user: createdUser,
      connections: createdConnections
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const userId = generateUserHash(email);
    
    // Example: Get user's 2nd degree connections
    const secondDegreeConnections = await Neo4jUserClient.getNthDegreeConnections(
      userId,
      2
    );
    
    // Example: Get potential matches (users connected via 2-3 degrees)
    const potentialMatches = await Neo4jUserClient.findPotentialMatches(
      userId,
      3,
      2
    );

    return NextResponse.json({
      userId,
      secondDegreeConnections,
      potentialMatches
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
} 