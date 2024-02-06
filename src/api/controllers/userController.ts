import {param} from 'express-validator';
import {Request, Response, NextFunction} from 'express';
import userModel from '../models/userModel';
import CustomError from '../../classes/CustomError';
import jwt from 'jsonwebtoken';
import {Document} from 'mongoose';
import {User, UserInput} from '../../types/DBTypes';
import {UserOutput} from '../../types/DBTypes';
import bcrypt from 'bcrypt';
import {MessageResponse} from '../../types/MessageTypes';

// TODO: create the following functions:
// - userGet - get user by id

// - userGet - get user by id
const userGet = async (
  req: Request<{id: string}>,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    console.log('TOIMIIKO TÄMÄKÄÄN');
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// - userGetCurrent - get current user and return user without password and role
const userGetCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user._id;

    const user = await userModel
      .findById(userId)
      .select('-password -role')
      .lean();

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    res.status(200).json({
      message: 'Current user retrieved successfully',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// - userListGet - get all users

const userListGet = async (
  req: Request,
  res: Response<UserOutput[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find().select('-password -role');
    if (!users) {
      throw new CustomError('No users found', 404);
    }
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// - userPost - create new user. Remember to hash password

const userPost = async (
  req: Request<{}, {}, UserInput>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const {user_name, email, password} = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({user_name, email, password: hashedPassword});

    await user.save();

    res.status(200).json({
      message: 'User deleted',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// - userPutCurrent - update current user

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedUser = await userModel
      .findByIdAndUpdate(res.locals.user._id, req.body, {
        //id saadaan localin kautta
        new: true,
      })
      .select('-password -role');
    if (!updatedUser) {
      throw new CustomError('User not found', 404);
    }
    res.status(200).json({
      message: 'User added',
      data: {
        _id: updatedUser._id,
        user_name: updatedUser.user_name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// - userDeleteCurrent - delete current user

const userDeleteCurrent = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const user = (await userModel.findByIdAndDelete(
      res.locals.user._id
    )) as unknown as User | null; //Vähän viritys mutta toimii
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.status(200).json({
      message: 'User deleted',
      data: {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query

const checkToken = async (
  req: Request,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    res.json(res.locals.user);
  } catch (error) {
    next(error);
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
  userGetCurrent,
};
