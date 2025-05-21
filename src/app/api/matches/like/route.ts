import { NextResponse } from "next/server";
import { Neo4jUserClient, generateUserHash, getSession } from "../../../../server/db/neo4j";

export async function POST(request: Request) {
  try {
    const { sourceEmail, targetEmail } = await request.json();
    
    if (!sourceEmail || !targetEmail) {
      return NextResponse.json(
        { error: "Source and target emails are required" },
        { status: 400 }
      );
    }
    
    const sourceId = generateUserHash(sourceEmail);
    const targetId = generateUserHash(targetEmail);
    
    // Store the "like" in Neo4j
    const session = getSession();
    
    try {
      // Create a "LIKED" relationship from source to target
      await session.executeWrite(async (tx: any) => {
        return await tx.run(
          `
          MATCH (a:User {email: $sourceEmail})
          MATCH (b:User {email: $targetEmail}) 
          MERGE (a)-[r:LIKED {createdAt: datetime()}]->(b)
          RETURN a.email, b.email, r
          `,
          { sourceEmail, targetEmail }
        );
      });
      
      // Check if target has already liked source (mutual like = match)
      const matchResult = await session.executeRead(async (tx: any) => {
        return await tx.run(
          `
          MATCH (a:User {email: $targetEmail})-[r:LIKED]->(b:User {email: $sourceEmail})
          RETURN a, b, r
          `,
          { sourceEmail, targetEmail }
        );
      });
      
      const isMatch = matchResult.records.length > 0;
      
      // If it's a match, create a MATCHED relationship
      if (isMatch) {
        await session.executeWrite(async (tx: any) => {
          return await tx.run(
            `
            MATCH (a:User {email: $sourceEmail})
            MATCH (b:User {email: $targetEmail})
            MERGE (a)-[r1:MATCHED {createdAt: datetime()}]->(b)
            MERGE (b)-[r2:MATCHED {createdAt: datetime()}]->(a)
            RETURN a, b
            `,
            { sourceEmail, targetEmail }
          );
        });
      }
      
      return NextResponse.json({
        success: true,
        isMatch,
        sourceId,
        targetId
      });
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.error("Error processing like:", error);
    return NextResponse.json(
      { error: "Failed to process like" },
      { status: 500 }
    );
  }
} 