const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(`Hashed Password: ${hashedPassword}`);
};

// Replace 'your_password_here' with the desired plain text password
hashPassword("");
