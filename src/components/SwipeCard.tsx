'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { User, Interest } from '../types/user';

// Extend User type to include connectionDegree for UI display
interface ExtendedUser extends User {
  connectionDegree?: number;
}

interface SwipeCardProps {
  user: ExtendedUser;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export default function SwipeCard({ user, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setStartX(e.touches[0].clientX);
      setIsDragging(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.clientX) {
      setStartX(e.clientX);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) {
      setCurrentX(e.touches[0].clientX - startX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && e.clientX) {
      setCurrentX(e.clientX - startX);
    }
  };

  const handleTouchEnd = () => {
    handleSwipeEnd();
  };

  const handleMouseUp = () => {
    handleSwipeEnd();
  };

  const handleSwipeEnd = () => {
    setIsDragging(false);
    
    // Threshold for swipe (in pixels)
    const swipeThreshold = 100;
    
    if (currentX > swipeThreshold) {
      onSwipeRight();
    } else if (currentX < -swipeThreshold) {
      onSwipeLeft();
    }
    
    // Reset position
    setCurrentX(0);
  };

  // Animation and transform styles
  const cardStyle = {
    transform: `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease',
  };
  
  // Dynamic opacity for like/dislike indicators
  const likeOpacity = Math.min(currentX / 100, 1);
  const dislikeOpacity = Math.min(-currentX / 100, 1);

  const getProfileImage = () => {
    if (user.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    
    // If user has photos, return the primary one or the first one
    if (user.photos && user.photos.length > 0) {
      const primaryPhoto = user.photos.find(photo => photo.isPrimary);
      if (primaryPhoto && primaryPhoto.url) {
        return primaryPhoto.url;
      }
      if (user.photos[0] && user.photos[0].url) {
        return user.photos[0].url;
      }
    }
    
    // Fallback to generic avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=200`;
  };

  return (
    <div 
      className="relative h-[70vh] w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-lg"
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Like indicator */}
      <div 
        className="absolute left-4 top-8 z-10 rotate-[-30deg] rounded-lg bg-green-500 px-6 py-2 text-2xl font-bold text-white"
        style={{ opacity: likeOpacity }}
      >
        LIKE
      </div>
      
      {/* Dislike indicator */}
      <div 
        className="absolute right-4 top-8 z-10 rotate-[30deg] rounded-lg bg-red-500 px-6 py-2 text-2xl font-bold text-white"
        style={{ opacity: dislikeOpacity }}
      >
        NOPE
      </div>
      
      {/* Profile Image */}
      <div className="relative h-3/4 w-full">
        <Image
          src={getProfileImage()}
          alt={`Profile of ${user.name}`}
          fill
          className="object-cover"
          unoptimized // For external images
        />
      </div>
      
      {/* User Info */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-sm">
            {calculateAge(user.birthdate)}
          </span>
        </div>
        
        {/* Interests */}
        <div className="flex flex-wrap gap-2">
          {user.interests.map((interest) => (
            <span 
              key={interest.id} 
              className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
            >
              {interest.name}
            </span>
          ))}
        </div>
        
        {/* Connection degree if available */}
        {user.connectionDegree && (
          <div className="mt-2 flex items-center space-x-1 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">
              {user.connectionDegree === 1
                ? 'Direct connection'
                : `${user.connectionDegree}${getOrdinalSuffix(user.connectionDegree)} degree connection`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate age from birthdate
function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
} 