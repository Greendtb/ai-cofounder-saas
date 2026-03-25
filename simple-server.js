const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple in-memory storage for MVP
let users = [];
let subscribers = [];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    users: users.length,
    subscribers: subscribers.length 
  });
});

app.post('/api/signup', (req, res) => {
  const { email, agentName } = req.body;
  
  if (!email || !agentName) {
    return res.status(400).json({ error: 'Email and agent name required' });
  }
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: Date.now().toString(),
    email,
    agentName,
    createdAt: new Date().toISOString(),
    status: 'trial'
  };
  
  users.push(user);
  
  res.json({ 
    success: true, 
    message: 'Account created successfully!',
    user: { id: user.id, email: user.email, agentName: user.agentName }
  });
});

app.post('/api/subscribe', (req, res) => {
  const { userId, stripeSessionId } = req.body;
  
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const subscription = {
    id: Date.now().toString(),
    userId,
    status: 'active',
    amount: 2900, // $29.00
    createdAt: new Date().toISOString()
  };
  
  subscribers.push(subscription);
  user.status = 'subscribed';
  
  res.json({ 
    success: true,
    message: 'Subscription activated!',
    subscription
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalUsers: users.length,
    activeSubscribers: subscribers.filter(s => s.status === 'active').length,
    monthlyRevenue: subscribers.length * 29,
    recentSignups: users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 24*60*60*1000)).length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Co-Founder MVP running on http://localhost:${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;