import neo4j, { Driver, Session, type QueryResult } from 'neo4j-driver';
import { env } from '../../env';
import crypto from 'crypto';
import type { User, Connection, ConnectionStatus } from '../../types/user';

// Create a Neo4j driver instance
let driver: Driver;

/**
 * Initialize the Neo4j driver if it hasn't been initialized yet
 */
export const initNeo4j = () => {
  if (!driver) {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD)
    );
  }
  return driver;
};

/**
 * Get a Neo4j session
 */
export const getSession = (): Session => {
  const driver = initNeo4j();
  return driver.session({ database: env.NEO4J_DATABASE });
};

/**
 * Close the Neo4j driver connection
 */
export const closeDriver = async () => {
  if (driver) {
    await driver.close();
  }
};

/**
 * Generate a hash from email for user IDs
 * @param email User email
 */
export const generateUserHash = (email: string): string => {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
};

/**
 * User node operations
 */
export class Neo4jUserClient {
  /**
   * Create a new user node
   * @param user User data
   */
  static async createUser(user: User): Promise<User> {
    const session = getSession();
    
    try {
      const userId = generateUserHash(user.email);
      
      // Create user node with basic properties
      const result = await session.executeWrite(async (tx: any) => {
        return await tx.run(
          `
          MERGE (u:User {id: $userId})
          ON CREATE SET
            u.email = $email,
            u.name = $name,
            u.username = $username,
            u.profilePictureUrl = $profilePictureUrl,
            u.bio = $bio,
            u.gender = $gender,
            u.birthdate = $birthdate,
            u.phone = $phone,
            u.isVerified = $isVerified,
            u.isActive = $isActive,
            u.createdAt = datetime(),
            u.updatedAt = datetime(),
            u.lastActive = datetime()
          ON MATCH SET
            u.name = $name,
            u.username = $username,
            u.profilePictureUrl = $profilePictureUrl,
            u.bio = $bio,
            u.gender = $gender,
            u.phone = $phone,
            u.isVerified = $isVerified,
            u.isActive = $isActive,
            u.updatedAt = datetime(),
            u.lastActive = datetime()
          RETURN u
          `,
          {
            userId,
            email: user.email,
            name: user.name,
            username: user.username || null,
            profilePictureUrl: user.profilePictureUrl || null,
            bio: user.bio || null,
            gender: user.gender,
            birthdate: user.birthdate.toISOString(),
            phone: user.phone || null,
            isVerified: user.isVerified,
            isActive: user.isActive,
          }
        );
      });
      
      // Set the ID in the user object
      user.id = userId;
      
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Create connections between users
   * @param userEmail Email of the source user
   * @param connectionEmails List of email addresses to connect with
   * @param status Connection status (default: ACCEPTED)
   */
  static async createConnections(
    userEmail: string, 
    connectionEmails: string[], 
    status: ConnectionStatus = 'ACCEPTED' as ConnectionStatus
  ): Promise<Connection[]> {
    const session = getSession();
    const connections: Connection[] = [];
    const userId = generateUserHash(userEmail);
    
    try {
      // Process each connection
      for (const targetEmail of connectionEmails) {
        // Skip self-connections
        if (userEmail.toLowerCase() === targetEmail.toLowerCase()) continue;
        
        const connectionId = generateUserHash(targetEmail);
        
        // Simple approach: directly create the connection relationship
        const result = await session.executeWrite(async (tx: any) => {
          return await tx.run(`
            MATCH (a:User {email: $userEmail})
            MATCH (b:User {email: $targetEmail}) 
            MERGE (a)-[r1:CONNECTED_TO {status: $status}]->(b)
            ON CREATE SET 
              r1.createdAt = datetime(),
              r1.updatedAt = datetime()
            ON MATCH SET 
              r1.status = $status,
              r1.updatedAt = datetime()
            MERGE (b)-[r2:CONNECTED_TO {status: $status}]->(a)
            ON CREATE SET 
              r2.createdAt = datetime(),
              r2.updatedAt = datetime()
            ON MATCH SET 
              r2.status = $status,
              r2.updatedAt = datetime()
            RETURN a.email as sourceEmail, b.email as targetEmail
          `, { 
            userEmail,
            targetEmail,
            status 
          });
        });
        
        // Log the result for debugging
        const records = result.records;
        if (records && records.length > 0) {
          console.log(`Created connection: ${records[0].get('sourceEmail')} <-> ${records[0].get('targetEmail')}`);
        }
        
        // Create connection objects for return
        const now = new Date();
        const connection: Connection = {
          id: `${userId}_${connectionId}`,
          userIdA: userId,
          userIdB: connectionId,
          status,
          createdAt: now,
          updatedAt: now,
          connectionDegree: 1
        };
        connections.push(connection);
      }
      
      return connections;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all nth degree connections for a user
   * @param userId User ID
   * @param degree Connection degree (1 = direct, 2 = friend of friend, etc.)
   * @param status Connection status (default: ACCEPTED)
   */
  static async getNthDegreeConnections(
    userId: string,
    degree: number = 1,
    status: ConnectionStatus = 'ACCEPTED' as ConnectionStatus
  ): Promise<User[]> {
    if (degree < 1) {
      throw new Error('Degree must be at least 1');
    }
    
    const session = getSession();
    
    try {
      // Ensure integer for Neo4j query
      const intDegree = Math.floor(degree);
      
      // Use different Cypher queries based on the degree
      let query = '';
      if (intDegree === 1) {
        // Direct connections
        query = `
        MATCH (u:User {id: $userId})-[r:CONNECTED_TO {status: $status}]->(friend:User)
        RETURN friend
        `;
      } else {
        // Nth degree connections
        // This creates a path of exactly n connections, excluding shorter paths
        // We use a variable length path [n..n] to specify exact degree
        const prevDegree = intDegree - 1;
        query = `
        MATCH (u:User {id: $userId})-[:CONNECTED_TO*${intDegree}..${intDegree} {status: $status}]->(connection:User)
        WHERE NOT (u)-[:CONNECTED_TO*1..${prevDegree}]->(connection)
        RETURN DISTINCT connection
        `;
      }
      
      const result = await session.executeRead(async (tx: any) => {
        return await tx.run(query, { userId, status });
      });
      
      return result.records.map((record: any) => {
        const userNode = record.get('connection').properties;
        return mapNeo4jNodeToUser(userNode);
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Find the shortest path between two users
   * @param userIdA First user ID
   * @param userIdB Second user ID
   * @param maxDegree Maximum connection degree to search
   * @param status Connection status to consider
   */
  static async findShortestPath(
    userIdA: string,
    userIdB: string,
    maxDegree: number = 3,
    status: ConnectionStatus = 'ACCEPTED' as ConnectionStatus
  ): Promise<User[]> {
    const session = getSession();
    
    try {
      // Ensure integer for Neo4j query
      const intMaxDegree = Math.floor(maxDegree);
      
      const result = await session.executeRead(async (tx: any) => {
        return await tx.run(
          `
          MATCH path = shortestPath((a:User {id: $userIdA})-[:CONNECTED_TO*1..${intMaxDegree}]->(b:User {id: $userIdB}))
          WHERE ALL(rel IN relationships(path) WHERE rel.status = $status)
          RETURN path
          `,
          { userIdA, userIdB, status }
        );
      });
      
      if (result.records.length === 0) {
        return [];
      }
      
      // Extract users from the path
      const path = result.records[0].get('path');
      const nodes = path.segments.map((segment: any) => segment.start).concat([path.end]);
      
      return nodes.map((node: any) => mapNeo4jNodeToUser(node.properties));
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate the connection degree between two users
   * @param userIdA First user ID
   * @param userIdB Second user ID
   * @param maxDegree Maximum connection degree to check
   * @param status Connection status to consider
   */
  static async calculateConnectionDegree(
    userIdA: string,
    userIdB: string,
    maxDegree: number = 3,
    status: ConnectionStatus = 'ACCEPTED' as ConnectionStatus
  ): Promise<number | null> {
    const session = getSession();
    
    try {
      // Check if calculating path to same user
      if (userIdA === userIdB) {
        console.log(`Skip calculating path for same user ID: ${userIdA}`);
        return 0; // Same user = 0 degrees of separation
      }
      
      // Ensure integer for Neo4j query
      const intMaxDegree = Math.floor(maxDegree);
      
      const result = await session.executeRead(async (tx: any) => {
        return await tx.run(
          `
          MATCH path = shortestPath((a:User {id: $userIdA})-[:CONNECTED_TO*1..${intMaxDegree}]->(b:User {id: $userIdB}))
          WHERE ALL(rel IN relationships(path) WHERE rel.status = $status)
          RETURN length(path) as degree
          `,
          { userIdA, userIdB, status }
        );
      });
      
      if (result.records.length === 0) {
        return null;
      }
      
      return result.records[0].get('degree');
    } finally {
      await session.close();
    }
  }

  /**
   * Find potential matches based on connection degree and preferences
   * @param userId User ID to find matches for
   * @param maxDegree Maximum connection degree to consider
   * @param minDegree Minimum connection degree to consider (default: 2)
   * @param limit Maximum number of matches to return
   */
  static async findPotentialMatches(
    userId: string,
    maxDegree: number = 3,
    minDegree: number = 2,
    limit: number = 20
  ): Promise<User[]> {
    const session = getSession();
    
    try {
      // Ensure integers for Neo4j query
      const intMinDegree = Math.floor(minDegree);
      const intMaxDegree = Math.floor(maxDegree);
      const intLimit = Math.floor(limit);
      
      console.log(`\nFinding potential matches for user ID: ${userId}`);
      console.log(`Search criteria: minDegree=${intMinDegree}, maxDegree=${intMaxDegree}, limit=${intLimit}`);
      
      // For first-degree connections, use a direct query
      let result;
      if (intMinDegree === 1 && intMaxDegree === 1) {
        console.log('Using direct connection query for first-degree connections');
        result = await session.executeRead(async tx => {
          return await tx.run(
            `
            MATCH (u:User {id: $userId})-[r:CONNECTED_TO {status: 'ACCEPTED'}]->(friend:User)
            RETURN friend as potential, 1 as degree
            LIMIT $limit
            `,
            { userId, limit: neo4j.int(intLimit) }
          );
        });
      } else {
        // For other degree ranges, use the variable path pattern
        result = await session.executeRead(async tx => {
          return await tx.run(
            `
            MATCH (u:User {id: $userId})
            MATCH path = (u)-[:CONNECTED_TO*${intMinDegree}..${intMaxDegree} {status: 'ACCEPTED'}]->(potential:User)
            WHERE NOT (u)-[:CONNECTED_TO]->(potential)
              AND u.id <> potential.id
            WITH potential, length(path) AS degree
            ORDER BY degree
            LIMIT $limit
            RETURN potential, degree
            `,
            { userId, limit: neo4j.int(intLimit) }
          );
        });
      }
      
      console.log(`Query returned ${result.records.length} potential matches`);
      if (result.records.length === 0) {
        console.log('No potential matches found in database');
      }
      
      return result.records.map(record => {
        const userNode = record.get('potential').properties;
        const connectionDegree = record.get('degree');
        const user = mapNeo4jNodeToUser(userNode);
        return user;
      });
    } finally {
      await session.close();
    }
  }
}

/**
 * Helper function to map Neo4j node properties to User object
 * @param properties Neo4j node properties
 */
function mapNeo4jNodeToUser(properties: any): User {
  // Convert Neo4j datetime to JavaScript Date if needed
  let birthdate: Date;
  if (typeof properties.birthdate === 'string') {
    birthdate = new Date(properties.birthdate);
  } else if (properties.birthdate && properties.birthdate.year) {
    // Handle Neo4j DateTime object
    birthdate = new Date(
      properties.birthdate.year,
      properties.birthdate.month - 1,
      properties.birthdate.day,
      properties.birthdate.hour,
      properties.birthdate.minute,
      properties.birthdate.second
    );
  } else {
    birthdate = new Date();
  }

  // Map properties to User object
  return {
    id: properties.id,
    email: properties.email,
    name: properties.name || '',
    username: properties.username || undefined,
    profilePictureUrl: properties.profilePictureUrl || undefined,
    bio: properties.bio || undefined,
    birthdate,
    gender: properties.gender || 'PREFER_NOT_TO_SAY',
    phone: properties.phone || undefined,
    isVerified: Boolean(properties.isVerified),
    isActive: Boolean(properties.isActive),
    createdAt: new Date(properties.createdAt),
    updatedAt: new Date(properties.updatedAt),
    lastActive: properties.lastActive ? new Date(properties.lastActive) : undefined,
    photos: [],
    preferences: {
      id: '',
      userId: properties.id,
      genderPreferences: [],
      maxConnectionDegree: 3
    },
    interests: [],
    connections: [],
    matches: [],
    receivedMessages: [],
    sentMessages: [],
    connectionMetrics: {
      directConnectionsCount: 0,
      secondDegreeConnectionsCount: 0,
      totalReachableUsersCount: 0
    }
  };
} 