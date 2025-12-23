import express from "express";

// Tiny static server for client/ during development.
const app = express();

app.use(express.static(new URL("../client", import.meta.url).pathname));

const PORT = Number(process.env.CLIENT_PORT || 5173);
app.listen(PORT, () => {
  console.log(`client static server: http://localhost:${PORT}`);
});
