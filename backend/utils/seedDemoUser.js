/**
 * Ensures a fixed demo admin exists for local testing (created once if missing).
 * Do not use these credentials in production.
 */
const bcrypt = require("bcrypt");
const User = require("../models/User");

const DEMO_EMAIL = "admin@demo.com";
const DEMO_PASSWORD = "Demo@12345";
const DEMO_NAME = "Demo Admin";

const seedDemoUser = async () => {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  await User.findOneAndUpdate(
    { email: DEMO_EMAIL },
    {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    },
    { upsert: true, new: true }
  );
};

module.exports = { seedDemoUser, DEMO_EMAIL, DEMO_PASSWORD };
