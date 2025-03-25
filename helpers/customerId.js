import User from "../models/userSchema.js";

export const generateUserId = async () => {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const id = `ZNCC${randomNumber}`;
    const ifExists = await User.findOne({userId:id});
    if (ifExists) {
      return generateUserId();
    }
    return id;
  };

