// Simple test script for HPZ Chatbot Backend
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001';

// Test functions
async function testHealth() {
  console.log('🔍 Testing health endpoint...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function testChatCommands() {
  console.log('🔍 Testing chat commands endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/chat/commands`);
    const data = await response.json();
    console.log('✅ Commands fetched:', data.commands?.length || 0, 'commands available');
    data.commands?.forEach(cmd => {
      console.log(`   • ${cmd.command}: ${cmd.description}`);
    });
  } catch (error) {
    console.error('❌ Commands test failed:', error.message);
  }
}

async function testChatStatus() {
  console.log('🔍 Testing chat status endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/chat/status`);
    const data = await response.json();
    console.log('✅ Chat status:', data.services);
  } catch (error) {
    console.error('❌ Chat status test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting HPZ Chatbot Backend Tests\n');

  await testHealth();
  console.log('');

  await testChatCommands();
  console.log('');

  await testChatStatus();
  console.log('');

  console.log('✨ Tests completed!');
}

runTests().catch(console.error);