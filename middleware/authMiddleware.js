import { User } from "../schema/User.js";

export const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({
    accessToken: req.header("Authorization")
  });
  if (user) {
    req.user = user
    next();
  } else {
    res.status(401).json({
      loggedOut: true
    });
  }
};
