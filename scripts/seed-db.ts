#!/usr/bin/env node

/**
 * Script to seed Neo4j database with mock user data
 */

import { insertMockData } from '../src/mockdata/insertMockData';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Verify that Neo4j environment variables are set
const requiredEnvVars = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Error: The following environment variables are required: ${missingEnvVars.join(', ')}`);
  console.error('Please set them in your .env file');
  process.exit(1);
}

console.log('\n🌱 Seeding Neo4j database with mock data...\n');

insertMockData()
  .then(() => {
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Database seeding failed:', err);
    process.exit(1);
  }); 