const IotDataInfo = require("../models/iot_data.model");
const iotDataService = require("../services/iot_data.service");

const getAllIotData = async (req, res) => {
  try {
    const iotDatas = await IotDataInfo.findAll();
    res.json(iotDatas);
  } catch (error) {
    res.status(500).json({ error: "Error fetching iotDatas" });
  }
};

const createIotData = async (req, res) => {
  try {
    const { ...iotData } = req.body;
    const newIotData = await iotDataService.createIotData({ ...iotData });
    res.status(201).json(newIotData);
  } catch (error) {
    res.status(500).json({ error: "Error creating iotData" });
  }
};

const updateIotData = async (req, res) => {
  try {
    const { id, ...otherFields } = req.body; // Adjust as needed to accept relevant fields
    if (!id) {
      return res.status(400).send("IotData id required.");
    }
    if (!otherFields || Object.keys(otherFields).length === 0) {
      return res.status(400).send("No fields to update.");
    }
    // Update the user information in the database
    const updatedIotData = await iotDataService.updateIotData(id, {
      ...otherFields, // Spread other fields if there are additional updates
    });

    if (!updatedIotData) {
      return res.status(404).send("IotData not found!");
    }
    res.json({
      status: "SUCCESS",
      message: "IotData updated successfully!",
      IotData: updatedIotData,
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating iotData" });
  }
};

const iotDataInfo = async (req, res) => {
  try {
    const { ...otherFields } = req.body; // Adjust as needed to accept relevant fields

    if (!otherFields || Object.keys(otherFields).length === 0) {
      return res.status(400).send("No fields to update.");
    }

    // Update the user information in the database
    const updatedUser = await userService.updateUser(req.user.username, {
      ...otherFields, // Spread other fields if there are additional updates
    });

    if (!updatedUser) {
      return res.status(404).send("User not found!");
    }
    res.json({
      status: "SUCCESS",
      message: "User updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching iotData" });
  }
};

const deleteIotData = async (req, res) => {
  try {
    console.log(req.body.id)
    const iotData = await iotDataService.getIotDataById(req.body.id);
    console.log(iotData)
    if (iotData) {
      await iotData.destroy();
      res.json({ message: "IotData deleted" });
    } else {
      res.status(404).json({ error: "IotData not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error deleting iotData" });
  }
};

module.exports = {
  getAllIotData,
  createIotData,
  updateIotData,
  iotDataInfo,
  deleteIotData,
};
