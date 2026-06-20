import addressModel from "../models/address.model.js";

// add user address
async function createAddress(req, res) {
  try {
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get user address
async function getMyAddresses(req, res) {
  try {
    const addresses = await addressModel.find({
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// get address by id
async function getMyAddressById(req, res) {
  try {
    const { id } = req.params;

    const address = await addressModel.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address is not found",
      });
    }

    return res.status(200).json({
      success: true,
      address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// update address
async function updateMyAddress(req, res) {
  try {
    const { id } = req.params;

    const address = await addressModel.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// delete address
async function deleteMyAddress(req, res) {
  try {
    const { id } = req.params;

    const address = await addressModel.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await address.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const addressController = {
  createAddress,
  getMyAddresses,
  getMyAddressById,
  updateMyAddress,
  deleteMyAddress,
};
