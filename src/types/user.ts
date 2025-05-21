/**
 * User Types for the Circl App
 * Represents user data and connection relationships
 */

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  NON_BINARY = "NON_BINARY",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum ConnectionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
}

export enum InterestCategory {
  SPORTS = "SPORTS",
  MUSIC = "MUSIC",
  MOVIES = "MOVIES",
  BOOKS = "BOOKS", 
  TRAVEL = "TRAVEL",
  FOOD = "FOOD",
  ART = "ART",
  GAMING = "GAMING",
  TECHNOLOGY = "TECHNOLOGY",
  FITNESS = "FITNESS",
  EDUCATION = "EDUCATION",
  CAREER = "CAREER",
  OTHER = "OTHER",
}

export interface Interest {
  id: string;
  category: InterestCategory;
  name: string;
}

export interface UserPhoto {
  id: string;
  userId: string;
  url: string;
  isPrimary: boolean;
  uploadedAt: Date;
}

export interface UserPreference {
  id: string;
  userId: string;
  minAge?: number;
  maxAge?: number;
  genderPreferences: Gender[];
  maxConnectionDegree: number; // nth degree connection limit
  locationRadius?: number; // in kilometers
  interests?: string[]; // Interest IDs
}

export interface Connection {
  id: string;
  userIdA: string;
  userIdB: string;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
  connectionDegree: number; // 1 = direct, 2 = friend of friend, etc.
}

export interface Match {
  id: string;
  userIdA: string;
  userIdB: string;
  createdAt: Date;
  connectionPathIds: string[]; // IDs of connections that form the path between users
  lastMessageAt?: Date;
  isActive: boolean;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: Date;
  readAt?: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  lastUpdated: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  profilePictureUrl?: string;
  bio?: string;
  birthdate: Date;
  gender: Gender;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  photos: UserPhoto[];
  location?: Location;
  preferences: UserPreference;
  interests: Interest[];
  connections: Connection[];
  directConnections?: User[];
  matches: Match[];
  receivedMessages: Message[];
  sentMessages: Message[];
  connectionMetrics: {
    directConnectionsCount: number;
    secondDegreeConnectionsCount: number;
    totalReachableUsersCount: number;
  };
}

export class UserManager {
  /**
   * Gets all nth degree connections for a user
   * @param userId User ID to get connections for
   * @param degree Connection degree (1 = direct, 2 = friend of friend, etc.)
   * @param maxDegree Maximum degree to search (for recursive calls)
   */
  static async getNthDegreeConnections(
    userId: string, 
    degree: number = 1,
    maxDegree: number = 3
  ): Promise<User[]> {
    // This would be implemented with actual database queries
    // For now it's just a placeholder
    return [];
  }

  /**
   * Checks if two users are connected within n degrees
   * @param userIdA First user ID
   * @param userIdB Second user ID
   * @param maxDegree Maximum connection degree to check
   */
  static async areUsersConnected(
    userIdA: string,
    userIdB: string,
    maxDegree: number = 3
  ): Promise<boolean> {
    // This would be implemented with actual database queries
    // For now it's just a placeholder
    return false;
  }

  /**
   * Gets the shortest connection path between two users
   * @param userIdA First user ID
   * @param userIdB Second user ID
   * @param maxDegree Maximum connection degree to check
   */
  static async getConnectionPath(
    userIdA: string,
    userIdB: string,
    maxDegree: number = 3
  ): Promise<User[]> {
    // This would be implemented with graph traversal algorithms
    // For now it's just a placeholder
    return [];
  }
} 