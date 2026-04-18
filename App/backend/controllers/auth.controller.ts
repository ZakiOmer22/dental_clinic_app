import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

export const login = async (req: { user: any; }, res: { cookie: (arg0: string, arg1: any, arg2: { httpOnly: boolean; secure: boolean; sameSite: string; path: string; }) => void; json: (arg0: { accessToken: any; }) => any; }) => {
  const user = req.user; // assume login already validated user

  const accessToken = signAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user.id,
    role: user.role,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/auth/refresh",
  });

  return res.json({ accessToken });
};

export const refreshTokenHandler = (req: { cookies: { refreshToken: string; }; }, res: { status: (arg0: number) => { json: (arg0: { message: string; }) => any; }; json: (arg0: { accessToken: any; }) => any; }) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const payload = verifyRefreshToken(token);

    const newAccessToken = signAccessToken({
      id: payload.id,
      role: payload.role,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};