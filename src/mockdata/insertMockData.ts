import { Neo4jUserClient, closeDriver } from '../server/db/neo4j';
import { mockUsers, mockConnections } from './userData';
import { env } from '../env';
import type { User } from '../types/user';

/**
 * Insert mock users and connections into Neo4j
 */
async function insertMockData() {
  console.log('Starting mock data insertion...');
  console.log(`Neo4j URI: ${env.NEO4J_URI}`);
  
  try {
    // Insert users
    console.log(`\nInserting ${mockUsers.length} users...`);
    for (let i = 0; i < mockUsers.length; i++) {
      const mockUser = mockUsers[i];
      if (!mockUser) {
        console.warn(`\nSkipping undefined user at index ${i}`);
        continue;
      }
      
      try {
        // Cast mock user to match User type required by Neo4jUserClient
        const userData: User = {
          id: mockUser.id || `user-${i}`,
          email: mockUser.email || `user${i}@example.com`,
          name: mockUser.name || `User ${i}`,
          username: mockUser.username,
          profilePictureUrl: mockUser.profilePictureUrl,
          bio: mockUser.bio,
          birthdate: mockUser.birthdate || new Date(),
          gender: mockUser.gender,
          phone: mockUser.phone,
          isVerified: mockUser.isVerified || false,
          isActive: mockUser.isActive || true,
          createdAt: mockUser.createdAt || new Date(),
          updatedAt: mockUser.updatedAt || new Date(),
          lastActive: mockUser.lastActive,
          photos: mockUser.photos || [],
          location: mockUser.location,
          preferences: mockUser.preferences,
          interests: mockUser.interests || [],
          connections: [],
          matches: [],
          receivedMessages: [],
          sentMessages: [],
          connectionMetrics: mockUser.connectionMetrics || {
            directConnectionsCount: 0,
            secondDegreeConnectionsCount: 0,
            totalReachableUsersCount: 0
          }
        };
        
        const createdUser = await Neo4jUserClient.createUser(userData);
        process.stdout.write(`.`);
      } catch (error) {
        console.error(`\nError inserting user ${mockUser.email}:`, error);
      }
    }
    console.log(`\nInserted ${mockUsers.length} users successfully!`);

    // Process connections based on emails
    console.log(`\nCreating connections between users...`);
    const userConnectionMap = new Map<string, string[]>();
    
    // First, create a map of user emails to their connection emails
    mockUsers.forEach(user => {
      const directConnections = user.directConnections || [];
      const connectionEmails = directConnections
        .filter(conn => conn && conn.email)
        .map(conn => conn.email);
      userConnectionMap.set(user.email, connectionEmails);
    });

    // Now create connections for each user
    let connectionsCreated = 0;
    for (const [userEmail, connectionEmails] of userConnectionMap.entries()) {
      if (connectionEmails.length > 0) {
        try {
          const createdConnections = await Neo4jUserClient.createConnections(
            userEmail,
            connectionEmails
          );
          connectionsCreated += createdConnections.length;
          process.stdout.write(`+`);
        } catch (error) {
          console.error(`\nError creating connections for user ${userEmail}:`, error);
        }
      }
    }
    console.log(`\nCreated ${connectionsCreated} connections successfully!`);

    // Alternative approach: Use mockConnections directly
    console.log(`\nAdding connections from mockConnections...`);
    const processedPairs = new Set<string>();
    let additionalConnections = 0;
    
    for (const connection of mockConnections) {
      if (!connection || !connection.userIdA || !connection.userIdB) {
        console.warn('\nSkipping invalid connection');
        continue;
      }
      
      // Find the actual user emails from the IDs
      const userA = mockUsers.find(u => u && u.id === connection.userIdA);
      const userB = mockUsers.find(u => u && u.id === connection.userIdB);
      
      if (!userA || !userB || !userA.email || !userB.email) {
        continue;
      }
      
      // Create a unique pair identifier to avoid duplicates
      const pairId = [userA.email, userB.email].sort().join('_');
      
      if (!processedPairs.has(pairId)) {
        processedPairs.add(pairId);
        
        try {
          // Create connection directly with emails
          await Neo4jUserClient.createConnections(
            userA.email, 
            [userB.email]
          );
          additionalConnections++;
          process.stdout.write(`*`);
        } catch (error) {
          console.error(`\nError creating connection between ${userA.email} and ${userB.email}:`, error);
        }
      }
    }
    console.log(`\nCreated ${additionalConnections} additional connections from mockConnections!`);

    console.log('\nData insertion completed successfully!');
  } catch (error) {
    console.error('Error during data insertion:', error);
  } finally {
    // Close the Neo4j driver
    await closeDriver();
  }
}

// Execute if this script is run directly
if (process.argv[1] && process.argv[1].endsWith('insertMockData.ts')) {
  insertMockData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
} else {
  console.log('This script can be run directly to insert mock data into Neo4j');
}

export { insertMockData }; 