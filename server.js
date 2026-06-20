import app from "./src/app.js";
import config from "./src/config/config.js";
import connectToDatabase from "./src/config/db.js";

// connect to database
connectToDatabase();

// start the server
const server = app.listen(config.PORT, () => {
  console.log(`server is running on port: ${config.PORT}`);
});
