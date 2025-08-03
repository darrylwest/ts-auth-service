import { createAuthApp } from './appFactory';

// --- SERVER START ---
const PORT = process.env.PORT || 3001;
const app = createAuthApp();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
