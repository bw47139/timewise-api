// hash.js
import bcrypt from "bcryptjs";

const password = "Wawapisad5963";

const hash = bcrypt.hashSync(password, 10);
console.log("HASHED PASSWORD →", hash);
