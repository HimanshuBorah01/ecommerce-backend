import addressModel from "../models/address.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// add user address
export const createAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pinCode,
    country,
    isDefault,
  } = req.body;

  const address = await addressModel.create({
    user: req.user._id,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pinCode,
    country,
    isDefault,
  });

  return res.status(201).json({
    success: true,
    message: "Address created successfully",
    address,
  });
});

// get user address
export const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressModel.find({
    user: req.user._id,
  });

  return res.status(200).json({
    success: true,
    count: addresses.length,
    addresses,
  });
});

// get address by id
export const getMyAddressById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await addressModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    throw new ApiError(404, "Address is not found");
  }

  return res.status(200).json({
    success: true,
    address,
  });
});

// update address
export const updateMyAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await addressModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pinCode,
    country,
    isDefault,
  } = req.body;

  if (fullName) address.fullName = fullName;
  if (phone) address.phone = phone;
  if (addressLine1) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (city) address.city = city;
  if (state) address.state = state;
  if (pinCode) address.pinCode = pinCode;
  if (country) address.country = country;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await address.save();

  return res.status(200).json({
    success: true,
    message: "Address is updated successfully",
    address,
  });
});

// delete address
export const deleteMyAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await addressModel.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  await address.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
});
