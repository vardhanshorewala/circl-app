import { Gender, InterestCategory, ConnectionStatus } from '../types/user';
import type { User, Interest, UserPhoto, UserPreference, Connection, Match, Message, Location } from '../types/user';

// Create interests
const interests: Interest[] = [
  { id: 'int-1', category: InterestCategory.SPORTS, name: 'Basketball' },
  { id: 'int-2', category: InterestCategory.SPORTS, name: 'Soccer' },
  { id: 'int-3', category: InterestCategory.MUSIC, name: 'Rock' },
  { id: 'int-4', category: InterestCategory.MUSIC, name: 'Jazz' },
  { id: 'int-5', category: InterestCategory.MOVIES, name: 'Sci-Fi' },
  { id: 'int-6', category: InterestCategory.BOOKS, name: 'Fiction' },
  { id: 'int-7', category: InterestCategory.TRAVEL, name: 'Backpacking' },
  { id: 'int-8', category: InterestCategory.FOOD, name: 'Cooking' },
  { id: 'int-9', category: InterestCategory.ART, name: 'Painting' },
  { id: 'int-10', category: InterestCategory.GAMING, name: 'Video Games' },
  { id: 'int-11', category: InterestCategory.TECHNOLOGY, name: 'Programming' },
  { id: 'int-12', category: InterestCategory.FITNESS, name: 'Yoga' },
  { id: 'int-13', category: InterestCategory.EDUCATION, name: 'Languages' },
  { id: 'int-14', category: InterestCategory.CAREER, name: 'Networking' },
  { id: 'int-15', category: InterestCategory.OTHER, name: 'Meditation' }
];

// Helper function to get random interests
const getRandomInterests = (count: number): Interest[] => {
  const shuffled = [...interests].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

interface MockUser extends Omit<User, 'connections' | 'matches' | 'receivedMessages' | 'sentMessages'> {
  connections: Connection[];
  matches: Match[];
  receivedMessages: Message[];
  sentMessages: Message[];
}

// Create mock data for 20 users
export const mockUsers = Array.from({ length: 20 }).map((_, index) => {
  const userId = `user-${index + 1}`;
  const userInterests = getRandomInterests(Math.floor(Math.random() * 5) + 1);
  const birthYear = 1980 + Math.floor(Math.random() * 25);
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  
  const userPhotos: UserPhoto[] = Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, photoIndex) => ({
    id: `photo-${userId}-${photoIndex + 1}`,
    userId,
    url: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${index + photoIndex}.jpg`,
    isPrimary: photoIndex === 0,
    uploadedAt: new Date(Date.now() - Math.random() * 10000000000)
  }));

  const genderOptions = [Gender.MALE, Gender.FEMALE, Gender.NON_BINARY, Gender.OTHER];
  const userGender = genderOptions[Math.floor(Math.random() * genderOptions.length)] || Gender.PREFER_NOT_TO_SAY;
  
  const preferences: UserPreference = {
    id: `pref-${userId}`,
    userId,
    minAge: 20 + Math.floor(Math.random() * 10),
    maxAge: 35 + Math.floor(Math.random() * 15),
    genderPreferences: Math.random() > 0.5
      ? [genderOptions[Math.floor(Math.random() * genderOptions.length)] || Gender.PREFER_NOT_TO_SAY]
      : genderOptions.filter(g => g !== undefined),
    maxConnectionDegree: Math.floor(Math.random() * 3) + 1,
    locationRadius: 10 + Math.floor(Math.random() * 50),
    interests: userInterests.map(i => i.id)
  };

  return {
    id: userId,
    email: `user${index + 1}@example.com`,
    name: `User ${index + 1}`,
    username: `user${index + 1}`,
    profilePictureUrl: userPhotos[0]?.url,
    bio: `This is the bio for User ${index + 1}. They enjoy ${userInterests.map(i => i.name).join(', ')}.`,
    birthdate: new Date(birthYear, birthMonth, birthDay),
    gender: userGender,
    phone: `+1${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 900) + 100}${Math.floor(Math.random() * 9000) + 1000}`,
    isVerified: Math.random() > 0.3,
    isActive: Math.random() > 0.1,
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
    updatedAt: new Date(Date.now() - Math.random() * 1000000000),
    lastActive: new Date(Date.now() - Math.random() * 10000000),
    photos: userPhotos,
    location: {
      latitude: 37.7749 + (Math.random() - 0.5) * 2,
      longitude: -122.4194 + (Math.random() - 0.5) * 2,
      city: `City ${Math.floor(Math.random() * 10) + 1}`,
      state: `State ${Math.floor(Math.random() * 5) + 1}`,
      country: 'United States',
      lastUpdated: new Date(Date.now() - Math.random() * 10000000)
    },
    preferences,
    interests: userInterests,
    connections: [] as Connection[],
    matches: [] as Match[],
    receivedMessages: [] as Message[],
    sentMessages: [] as Message[],
    connectionMetrics: {
      directConnectionsCount: Math.floor(Math.random() * 20),
      secondDegreeConnectionsCount: Math.floor(Math.random() * 100),
      totalReachableUsersCount: Math.floor(Math.random() * 1000)
    }
  } as MockUser;
}) as MockUser[];

// Create connections between users
export const mockConnections: Connection[] = [];

// Generate connections (about 3-5 per user)
mockUsers.forEach(user => {
  const connectionCount = Math.floor(Math.random() * 3) + 3;
  const possibleConnections = mockUsers.filter(u => u.id !== user.id);
  
  for (let i = 0; i < Math.min(connectionCount, possibleConnections.length); i++) {
    // Check if connection already exists
    const targetUserIndex = Math.floor(Math.random() * possibleConnections.length);
    const targetUser = possibleConnections[targetUserIndex];
    
    if (!targetUser) continue;
    
    const connectionExists = mockConnections.some(
      conn => (conn.userIdA === user.id && conn.userIdB === targetUser.id) || 
              (conn.userIdA === targetUser.id && conn.userIdB === user.id)
    );
    
    if (!connectionExists) {
      const connection: Connection = {
        id: `conn-${user.id}-${targetUser.id}`,
        userIdA: user.id,
        userIdB: targetUser.id,
        status: ConnectionStatus.ACCEPTED,
        createdAt: new Date(Date.now() - Math.random() * 10000000000),
        updatedAt: new Date(Date.now() - Math.random() * 1000000000),
        connectionDegree: 1 // Direct connection
      };
      
      mockConnections.push(connection);
    }
  }
});

// Update user connections
mockUsers.forEach(user => {
  user.connections = mockConnections.filter(
    conn => conn.userIdA === user.id || conn.userIdB === user.id
  );
});

// Create some matches between users who are connected
export const mockMatches: Match[] = [];

mockConnections.forEach(connection => {
  if (Math.random() > 0.7) { // 30% chance of connection becoming a match
    const match: Match = {
      id: `match-${connection.userIdA}-${connection.userIdB}`,
      userIdA: connection.userIdA,
      userIdB: connection.userIdB,
      createdAt: new Date(Date.now() - Math.random() * 1000000000),
      connectionPathIds: [connection.id],
      lastMessageAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 10000000) : undefined,
      isActive: Math.random() > 0.2
    };
    
    mockMatches.push(match);
  }
});

// Update user matches
mockUsers.forEach(user => {
  user.matches = mockMatches.filter(
    match => match.userIdA === user.id || match.userIdB === user.id
  );
});

// Create some messages for matches
export const mockMessages: Message[] = [];

mockMatches.forEach(match => {
  if (match.isActive) {
    const messageCount = Math.floor(Math.random() * 10) + 1;
    
    for (let i = 0; i < messageCount; i++) {
      const isSenderA = Math.random() > 0.5;
      const senderId = isSenderA ? match.userIdA : match.userIdB;
      const receiverId = isSenderA ? match.userIdB : match.userIdA;
      
      const message: Message = {
        id: `msg-${match.id}-${i}`,
        matchId: match.id,
        senderId,
        receiverId,
        content: `This is message ${i + 1} in the conversation.`,
        sentAt: new Date(Date.now() - Math.random() * 10000000),
        readAt: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 1000000) : undefined
      };
      
      mockMessages.push(message);
    }
  }
});

// Update user messages
mockUsers.forEach(user => {
  user.sentMessages = mockMessages.filter(msg => msg.senderId === user.id);
  user.receivedMessages = mockMessages.filter(msg => msg.receiverId === user.id);
}); 