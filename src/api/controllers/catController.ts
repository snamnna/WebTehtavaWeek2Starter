import {NextFunction, Request, Response} from 'express';
import {Cat, LoginUser} from '../../types/DBTypes';
import CatModel from '../models/catModel';
import CustomError from '../../classes/CustomError';
import {MessageResponse} from '../../types/MessageTypes';
// TODO: create following functions:

// - catListGet - get all cats
const catListGet = async (
  _req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find().select('-__v').populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catGet - get cat by id
const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.findById(req.params.id)
      .select('-__v')
      .populate({
        path: 'owner',
        select: '-__v -password -role',
      });
    if (!cats) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catGetByUser - get all cats by current user id
const catGetByUser = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Invalid user data', 400);
    }
    const cats = await CatModel.find({owner: res.locals.user._id});
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catPost - create new cat
const catPost = async (
  req: Request<{token: string; pic: string}, {}, Omit<Cat, '_id'>>,
  res: Response<MessageResponse & {data: Cat}>,
  next: NextFunction
) => {
  req.body.filename = req.file?.path || '';
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Invalid user data', 400);
    }

    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };

    const cat = await CatModel.create({
      ...req.body,
      owner: res.locals.user._id,
    });
    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// - catPut - only owner can update cat
const catPut = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError('Invalid user data', 400);
    }
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// - catPutAdmin - only admin can change cat owner
const catPutAdmin = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    // Check if the user is an admin
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      throw new CustomError(
        'Permission denied. Only admin can update the cat.',
        403
      );
    }
    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    const response: MessageResponse & {data: Cat} = {
      message: 'OK',
      data: cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// - catDelete - only owner can delete cat
const catDelete = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    if (!res.locals.user || !('_id' in res.locals.user)) {
      throw new CustomError(
        'Permission denied. You can only delete your own cat.',
        403
      );
    }
    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    const response: MessageResponse & {data: Cat} = {
      message: 'Cat deleted',
      data: cat as unknown as Cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// - catDeleteAdmin - only admin can delete cat
const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    // Check if the user is an admin
    if (!res.locals.user || res.locals.user.role !== 'admin') {
      throw new CustomError(
        'Permission denied. Only admin can delete the cat.',
        403
      );
    }
    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    const response: MessageResponse & {data: Cat} = {
      message: 'Cat deleted',
      data: cat as unknown as Cat,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
const catGetByBoundingBox = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const {minLat, maxLat, minLon, maxLon} = req.query;
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $box: [
            [Number(minLon), Number(minLat)],
            [Number(maxLon), Number(maxLat)],
          ],
        },
      },
    });
    res.json(cats);
  } catch (error) {
    next(error);
  }
};
export {
  catDelete,
  catDeleteAdmin,
  catGet,
  catGetByBoundingBox,
  catGetByUser,
  catListGet,
  catPost,
  catPut,
  catPutAdmin,
};
