import {NextFunction, Request, Response} from 'express';
import CatModel from '../models/catModel';
import {Cat, User} from '../../types/DBTypes';
import {Document} from 'mongoose';
import {Point} from 'geojson';
import {Types} from 'mongoose';
import CustomError from '../../classes/CustomError';

// TODO: create following functions:
// - catGetByUser - get all cats by current user id
const catGetByUser = async (
  req: Request<{id: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  const user = req.user as User;
  try {
    const cats = await CatModel.find({owner: user._id});
    if (!cats) {
      throw new CustomError('No cats found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {bbox: [number, number, number, number]}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  const bbox = req.query.bbox;
  try {
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $box: [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
        },
      },
    });
    if (!cats) {
      throw new CustomError('No cats found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catPutAdmin - only admin can change cat owner

const catPutAdmin = async (
  req: Request<{id: string}, {}, Cat, {}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  const id = req.params.id;
  const cat = req.body;
  const user = req.user as User;
  if (user.role !== 'admin') {
    throw new CustomError('Unauthorized', 401);
  }
  try {
    const updatedCat = await CatModel.findByIdAndUpdate(id, cat, {new: true});
    if (!updatedCat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(updatedCat);
  } catch (error) {
    next(error);
  }
};

// - catDeleteAdmin - only admin can delete cat

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response<{message: string}>,
  next: NextFunction
) => {
  const id = req.params.id;
  const user = req.user as User;
  if (user.role !== 'admin') {
    throw new CustomError('Unauthorized', 401);
  }
  try {
    const deletedCat = await CatModel.findByIdAndDelete(id);
    if (!deletedCat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted'});
  } catch (error) {
    next(error);
  }
};

// - catDelete - only owner can delete cat

const catDelete = async (
  req: Request<{id: string}>,
  res: Response<{message: string}>,
  next: NextFunction
) => {
  const id = req.params.id;
  const user = req.user as User;
  try {
    const deletedCat = await CatModel.findOneAndDelete({
      _id: id,
      owner: user._id,
    });
    if (!deletedCat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted'});
  } catch (error) {
    next(error);
  }
};

// - catPut - only owner can update cat
const catPut = async (
  req: Request<{id: string}, {}, Cat, {}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  const id = req.params.id;
  const cat = req.body;
  const user = req.user as User;
  try {
    const updatedCat = await CatModel.findOneAndUpdate(
      {_id: id, owner: user._id},
      cat,
      {new: true}
    );
    if (!updatedCat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(updatedCat);
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
  const id = req.params.id;
  try {
    const cat = await CatModel.findById(id).populate(
      'owner',
      'user_name email'
    );
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

// - catListGet - get all cats

const catListGet = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find().populate('owner', 'user_name email');
    if (!cats) {
      throw new CustomError('No cats found', 404);
    }
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

// - catPost - create new cat

const catPost = async (
  req: Request<{}, {}, Cat, {}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  const cat = req.body;
  const user = req.user as User;
  try {
    const newCat = new CatModel({
      ...cat,
      owner: user._id,
    });
    const savedCat = await newCat.save();
    res.json(savedCat);
  } catch (error) {
    next(error);
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
