
import httpStatus from "http-status";
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import { generateAuthTokens, verifyToken } from "../utils/token.js";

const fetchCompaniesFor = async (userId) => {
  const companies = await Company.find({ createdBy: userId })
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return companies.map((c) => ({ id: c._id, name: c.name }));
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.isEmailTaken(email)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Email already taken",
      });
    }

    const user = await User.create({ name, email, password, role });
    const tokens = await generateAuthTokens(user);
    const companies = await fetchCompaniesFor(user._id);

    res.status(httpStatus.CREATED).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      companies,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.isPasswordMatch(password))) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    if (!user.isActive) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    const tokens = await generateAuthTokens(user);
    const companies = await fetchCompaniesFor(user._id);

    res.status(httpStatus.OK).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      companies,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

const refreshAuth = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    try {
      const decoded = await verifyToken(refreshToken, "refresh");
      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "Invalid refresh token or user not found",
        });
      }

      const tokens = await generateAuthTokens(user);
      const companies = await fetchCompaniesFor(user._id);

      res.status(httpStatus.OK).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        companies,
        tokens,
      });
    } catch {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
  } catch (error) {
    next(error);
  }
};

export default { register, login, refreshAuth };
