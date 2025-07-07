import createApp from './app';

// --- SERVER START ---
const PORT = process.env.PORT || 3001;
const app = createApp();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
