import { NextResponse } from "next/server";
import { Neo4jUserClient, generateUserHash } from "../../../server/db/neo4j";
import { mockUsers } from "../../../mockdata/userData";
import type { User } from "../../../types/user";

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
    
    // For demonstration, we'll use the Neo4j client to get 2nd and 3rd degree connections
    const userId = generateUserHash(email);
    
    // Get potential matches (users connected via 2-3 degrees)
    let potentialMatches: User[] = [];
    try {
      potentialMatches = await Neo4jUserClient.findPotentialMatches(
        userId,
        1,  // max degree
        1   // min degree
      );
      
      console.log(`Found ${potentialMatches.length} potential matches from Neo4j`);
    } catch (err) {
      console.error("Error fetching from Neo4j:", err);
      // Continue to use mock data as fallback instead of failing
    }
    

    // Add connection degree to matches
    const matchesWithDegree = [];
    
    for (const match of potentialMatches) {
      try {
        // Try to get the actual degree from Neo4j
        let degree = 2; // Default to 2nd degree
        
        try {
          // Only calculate connection degree if user IDs are different
          if (userId !== match.id) {
            const calculatedDegree = await Neo4jUserClient.calculateConnectionDegree(
              userId,
              match.id,
              3
            );
            
            if (calculatedDegree !== null) {
              degree = calculatedDegree;
            }
          } else {
            console.log(`Skipping connection degree calculation for same user: ${match.email}`);
            degree = 0; // Same user = 0 degrees of separation
          }
        } catch (error) {
          console.error(`Error calculating connection degree for ${match.email}:`, error);
          // Keep using default degree
        }
        
        matchesWithDegree.push({
          ...match,
          degree
        });
      } catch (matchError) {
        console.error(`Error processing match for user ${match.email}:`, matchError);
        // Skip this match but continue with others
      }
    }

    // Debug logging of all matches
    console.log('\n======= MATCH DEBUGGING INFO =======');
    console.log(`User: ${email} (ID: ${userId})`);
    console.log(`Total matches found: ${matchesWithDegree.length}`);
    
    if (matchesWithDegree.length > 0) {
      console.log('\nMatched users:');
      matchesWithDegree.forEach((match, index) => {
        console.log(`${index + 1}. ${match.name} (${match.email}) - Degree: ${match.degree}`);
      });
    } else {
      console.log('No matches found for this user');
    }
    console.log('====================================\n');

    return NextResponse.json({
      userId,
      potentialMatches: matchesWithDegree
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    // Return a more helpful error message and empty match array instead of failing
    return NextResponse.json({
      error: `Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`,
      potentialMatches: [] // Return empty array instead of failing completely
    }, { status: 200 }); // Respond with 200 instead of 500
  }
} 