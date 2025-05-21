'use client';

import React, { useState, useEffect } from 'react';
import SwipeCard from './SwipeCard';
import type { User } from '../types/user';

// Extend User type to include connection degree for UI
interface ExtendedUser extends User {
  connectionDegree?: number;
}

export default function SwipeDeck() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch potential matches
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Get email from auth session or local storage
        // For now using hardcoded email for example
        const userEmail = 'user17@example.com';
        
        const response = await fetch(`/api/matches?email=${encodeURIComponent(userEmail)}`);
        const data = await response.json();
        
        // Check if the API returned an error message
        if (data.error) {
          console.error('API returned error:', data.error);
          setError(`Error from API: ${data.error}`);
          setUsers([]);
          return;
        }
        
        if (data.potentialMatches && Array.isArray(data.potentialMatches)) {
          if (data.potentialMatches.length === 0) {
            setError('No potential matches found in your network');
            setUsers([]);
            return;
          }
          
          // Add connection degree for UI display and convert date strings to Date objects
          const matchesWithDegree = data.potentialMatches.map((user: User & { degree?: number }) => {
            // Convert date strings back to Date objects
            return {
              ...user,
              connectionDegree: user.degree || 2, // Default to 2nd degree if not specified
              birthdate: new Date(user.birthdate),
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
              lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
              photos: user.photos?.map(photo => ({
                ...photo,
                uploadedAt: new Date(photo.uploadedAt)
              })) || [],
              location: user.location ? {
                ...user.location,
                lastUpdated: new Date(user.location.lastUpdated)
              } : undefined
            };
          });
          
          setUsers(matchesWithDegree);
        } else {
          setError('Invalid data format received from API');
          setUsers([]);
        }
        
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(`Failed to load potential matches: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSwipeLeft = () => {
    // Dislike logic - skip to next user
    setCurrentIndex(prevIndex => Math.min(prevIndex + 1, users.length));
  };

  const handleSwipeRight = async () => {
    if (currentIndex >= users.length) return;
    
    const currentUser = users[currentIndex];
    
    if (!currentUser || !currentUser.email) {
      console.error('Invalid user data for swiping');
      handleSwipeLeft(); // Skip to next
      return;
    }
    
    try {
      // Send like to API
      const response = await fetch('/api/matches/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetEmail: currentUser.email,
          // In a real app, you'd get the sourceEmail from auth context
          sourceEmail: 'user2@example.com'
        }),
      });
      
      // Handle match result if needed
      if (response.ok) {
        const result = await response.json();
        if (result.isMatch) {
          // Show match notification
          alert(`It's a match with ${currentUser.name}!`);
        }
      }
    } catch (err) {
      console.error('Error liking user:', err);
    }
    
    // Move to next user
    setCurrentIndex(prevIndex => Math.min(prevIndex + 1, users.length));
  };

  // No more users left
  if (!loading && (users.length === 0 || currentIndex >= users.length)) {
    return (
      <div className="flex h-[70vh] w-full max-w-sm flex-col items-center justify-center rounded-xl bg-white p-6 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h2 className="mb-2 text-xl font-semibold text-gray-700">No More Profiles</h2>
        <p className="text-center text-gray-500">
          {error || "You've seen everyone for now. Check back later for more connections!"}
        </p>
        <button 
          className="mt-6 rounded-full bg-indigo-600 px-6 py-3 text-white shadow-md hover:bg-indigo-700"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[70vh] w-full max-w-sm items-center justify-center rounded-xl bg-white shadow-lg">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading potential matches...</p>
        </div>
      </div>
    );
  }

  // Make sure we have a current user to display
  const currentUser = users[currentIndex];
  if (!currentUser) {
    return null;
  }

  // Render the current card
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center">
      <div className="relative flex w-full max-w-sm flex-col items-center">
        {/* Current card */}
        <SwipeCard
          user={currentUser}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
        
        {/* Action buttons */}
        <div className="mt-6 flex w-full justify-center space-x-4">
          <button 
            onClick={handleSwipeLeft}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-3 text-red-500 shadow-lg hover:bg-red-100"
            aria-label="Dislike"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            onClick={handleSwipeRight}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-3 text-green-500 shadow-lg hover:bg-green-100"
            aria-label="Like"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 