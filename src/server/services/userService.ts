import type { User, UserPreference, Connection, Gender, Interest } from '../../types/user';

export class UserService {
  /**
   * Find potential matches for a user based on their preferences and connection degree
   * @param userId ID of the user to find matches for
   */
  static async findPotentialMatches(userId: string): Promise<User[]> {
    // This would connect to your database and implement actual filtering logic
    // For now just returning an empty array as a placeholder
    return [];
  }

  /**
   * Get a user's direct connections
   * @param userId ID of the user to get direct connections for
   */
  static async getDirectConnections(userId: string): Promise<User[]> {
    // In a real implementation, this would query the database
    // With our new structure, we can just return the directConnections property
    // For the mock data, we'd look up the user and return their direct connections
    
    // This is a placeholder that would use the actual user repository in a real implementation
    const user = await this.getUserById(userId);
    return user?.directConnections || [];s
  }

  /**
   * Get a user by ID
   * @param userId ID of the user to get
   */
  static async getUserById(userId: string): Promise<User | null> {
    // This would connect to your database in a real implementation
    // For now just returning null as a placeholder
    return null;
  }

  /**
   * Filter users based on preference criteria
   * @param users List of users to filter
   * @param preferences User preferences to filter by
   */
  static filterUsersByPreferences(users: User[], preferences: UserPreference): User[] {
    return users.filter(user => {
      // Age filter
      if (preferences.minAge || preferences.maxAge) {
        const age = this.calculateAge(user.birthdate);
        if (preferences.minAge && age < preferences.minAge) return false;
        if (preferences.maxAge && age > preferences.maxAge) return false;
      }

      // Gender filter
      if (preferences.genderPreferences.length > 0 && 
          !preferences.genderPreferences.includes(user.gender)) {
        return false;
      }

      // Interests filter
      if (preferences.interests && preferences.interests.length > 0) {
        const hasCommonInterests = user.interests.some(interest => 
          preferences.interests?.includes(interest.id)
        );
        if (!hasCommonInterests) return false;
      }

      return true;
    });
  }

  /**
   * Calculate a user's age from their birthdate
   * @param birthdate User's date of birth
   */
  static calculateAge(birthdate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Calculate the connection degree between two users
   * Uses a breadth-first search algorithm to find the shortest path
   * @param connections All connections in the system
   * @param sourceUserId Starting user ID
   * @param targetUserId Target user ID
   */
  static calculateConnectionDegree(
    connections: Connection[],
    sourceUserId: string,
    targetUserId: string
  ): number | null {
    // Build adjacency list for graph traversal
    const adjacencyList = new Map<string, string[]>();
    
    connections.forEach(conn => {
      if (conn.status === 'ACCEPTED') {
        // Add both directions since connections are bidirectional
        if (!adjacencyList.has(conn.userIdA)) {
          adjacencyList.set(conn.userIdA, []);
        }
        if (!adjacencyList.has(conn.userIdB)) {
          adjacencyList.set(conn.userIdB, []);
        }
        
        adjacencyList.get(conn.userIdA)?.push(conn.userIdB);
        adjacencyList.get(conn.userIdB)?.push(conn.userIdA);
      }
    });
    
    // BFS implementation
    const queue: [string, number][] = [[sourceUserId, 0]]; // [userId, degree]
    const visited = new Set<string>([sourceUserId]);
    
    while (queue.length > 0) {
      const [currentUserId, degree] = queue.shift()!;
      
      if (currentUserId === targetUserId) {
        return degree;
      }
      
      const neighbors = adjacencyList.get(currentUserId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, degree + 1]);
        }
      }
    }
    
    // No path found
    return null;
  }

  /**
   * Find the connection path between two users
   * @param connections All connections in the system
   * @param sourceUserId Starting user ID
   * @param targetUserId Target user ID
   */
  static findConnectionPath(
    connections: Connection[],
    sourceUserId: string,
    targetUserId: string
  ): string[] | null {
    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    
    connections.forEach(conn => {
      if (conn.status === 'ACCEPTED') {
        if (!adjacencyList.has(conn.userIdA)) {
          adjacencyList.set(conn.userIdA, []);
        }
        if (!adjacencyList.has(conn.userIdB)) {
          adjacencyList.set(conn.userIdB, []);
        }
        
        adjacencyList.get(conn.userIdA)?.push(conn.userIdB);
        adjacencyList.get(conn.userIdB)?.push(conn.userIdA);
      }
    });
    
    // BFS with path tracking
    const queue: [string, string[]][] = [[sourceUserId, [sourceUserId]]];
    const visited = new Set<string>([sourceUserId]);
    
    while (queue.length > 0) {
      const [currentUserId, path] = queue.shift()!;
      
      if (currentUserId === targetUserId) {
        return path;
      }
      
      const neighbors = adjacencyList.get(currentUserId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    
    // No path found
    return null;
  }
} 